import os
from dotenv import load_dotenv
import replicate
import asyncio
import re
from tqdm import tqdm
from aiolimiter import AsyncLimiter
from typing import List

def preprocess_text_file(input_file: str) -> str:
    """
    Preprocess text file:
    1. Create backup of original file
    2. Remove empty lines and duplicates
    3. Sort by character length
    4. Update input file directly
    """
    try:
        # Read the file
        with open(input_file, 'r', encoding='utf-8') as file:
            lines = [line.strip() for line in file.readlines()]

        # Create backup
        backup_file = "backup.txt"
        with open(backup_file, 'w', encoding='utf-8') as file:
            for line in lines:
                file.write(f"{line}\n")
        print(f"Original tasks backed up to: {backup_file}")

        # Remove empty lines and duplicates
        lines = list(set(line for line in lines if line))

        # Sort by character length
        lines.sort(key=len)

        # Update input file directly
        with open(input_file, 'w', encoding='utf-8') as file:
            for line in lines:
                file.write(f"{line}\n")

        print(f"Preprocessed {len(lines)} unique tasks")
        return input_file

    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return None
    except Exception as e:
        print(f"Error during preprocessing: {str(e)}")
        return None

def read_input_file(filename: str) -> str:
    """Read and preprocess input file."""
    try:
        # Preprocess the input file
        processed_file = preprocess_text_file(filename)
        if not processed_file:
            print("Error during preprocessing.")
            exit(1)

        # Read the file
        with open(processed_file, 'r', encoding='utf-8') as file:
            return file.read()
    except FileNotFoundError:
        print(f"Error: Input file '{filename}' not found.")
        exit(1)

def clear_previous_results(output_dir: str):
    """Clear previous analysis results."""
    if os.path.exists(output_dir):
        for filename in os.listdir(output_dir):
            file_path = os.path.join(output_dir, filename)
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"Error removing {filename}: {e}")

# Load environment variables
load_dotenv()

# Get API token from environment variable
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not REPLICATE_API_TOKEN:
    print("Error: REPLICATE_API_TOKEN not found in environment variables.")
    print("Please set your Replicate API token in a .env file or environment variables.")
    print("You can get your API token from: https://replicate.com/account")
    exit(1)

# Configure the Replicate client with the API token
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# Add rate limiter for API calls
rate_limiter = AsyncLimiter(10, 1)  # 10 requests per second for stability

async def analyze_eisenhower(text: str, retries: int = 5) -> str:
    """Analyze text using Eisenhower Matrix logic in a single API call."""
    for attempt in range(retries):
        try:
            async with rate_limiter:
                print(f"  Attempt {attempt + 1}/{retries}")
                prompt = (
                    f"Task: {text}\n\n"
                    "Analyze this task carefully and categorize it as ONE of:\n"
                    "- important_urgent (critical tasks that need immediate attention)\n"
                    "- important (valuable tasks that contribute to long-term goals)\n"
                    "- unimportant (tasks that can be eliminated)\n\n"
                    "Consider:\n"
                    "- Important = high value, impacts goals, meaningful outcome\n"
                    "- Urgent = time-sensitive, needs immediate attention\n"
                    "Answer with ONLY the category name."
                )

                input_params = {
                    "prompt": prompt,
                    "max_tokens": 5,
                    "temperature": 0.1,
                    "system_prompt": (
                        "You are an expert at the Eisenhower Matrix method of task prioritization. "
                        "You carefully evaluate tasks based on their importance (value and impact) "
                        "and urgency (time sensitivity). Important tasks contribute to long-term goals "
                        "or have meaningful impact. Urgent tasks need immediate attention. "
                        "If a task is neither important nor urgent, categorize it as unimportant."
                    ),
                }

                output = ""
                try:
                    print("  Calling API...")
                    # Use llama-3 for better judgment
                    response = replicate.run(
                        "meta/meta-llama-3-70b-instruct",
                        input=input_params,
                        timeout=15.0
                    )
                    print(f"  Raw API response: {response}")

                    # Handle list response format
                    if isinstance(response, list):
                        # Join all parts and clean up
                        output = ''.join(response).strip().lower()
                        # Remove any newlines or extra spaces
                        output = ' '.join(output.split())
                        # Remove common prefixes the model might add
                        output = output.replace('category:', '').strip()
                        print(f"  Cleaned response: {output}")
                    else:
                        output = str(response).strip().lower()

                except Exception as e:
                    print(f"  API call failed: {str(e)}")
                    # For connection errors, wait longer between retries
                    if "Connection" in str(e) or "peer" in str(e):
                        await asyncio.sleep(5)
                    raise

                if not output:
                    print("  Empty response from API")
                    raise Exception("Empty response from API")

                # Map partial matches to valid categories
                if output == "important_urgent":
                    category = "important_urgent"
                elif output == "important":
                    category = "important"
                elif output == "unimportant":
                    category = "unimportant"
                else:
                    # If we can't get an exact match, try to map common variations
                    cleaned = output.replace(" ", "").replace("-", "").replace("_", "")
                    if "importanturgent" in cleaned or "urgentimportant" in cleaned:
                        category = "important_urgent"
                    elif cleaned == "important":
                        category = "important"
                    elif "unimportant" in cleaned or "notimportant" in cleaned:
                        category = "unimportant"
                    else:
                        print(f"  Could not map '{output}' to a valid category, defaulting to unimportant")
                        category = "unimportant"

                print(f"  Successfully categorized as: {category}")
                return category

        except Exception as e:
            if attempt < retries - 1:
                print(f"  Error occurred, retrying... ({attempt + 1}/{retries}): {str(e)}")
                wait_time = (attempt + 1) * 2
                print(f"  Waiting {wait_time} seconds before retry...")
                await asyncio.sleep(wait_time)
                continue
            print(f"  Error after {retries} attempts: {str(e)}")
            return "unimportant"

async def process_eisenhower(text: str, output_dir: str = "eisenhower_matrix"):
    """Process text using Eisenhower Matrix categories."""
    os.makedirs(output_dir, exist_ok=True)

    # Define the three categories
    categories = {
        "important_urgent.txt": "Important AND Urgent Tasks (Do First)",
        "important.txt": "Important BUT NOT Urgent Tasks (Schedule)",
        "unimportant.txt": "Unimportant Tasks (Eliminate)"
    }

    # Initialize results dictionary and load existing results
    results = {
        "important_urgent": [],
        "important": [],
        "unimportant": [],
        "uncategorized": []
    }

    # Load existing categorized tasks
    for category in results.keys():
        if category != "uncategorized":
            filepath = os.path.join(output_dir, f"{category}.txt")
            if os.path.exists(filepath):
                with open(filepath, 'r', encoding='utf-8') as f:
                    # Skip header lines
                    lines = f.readlines()[3:]
                    results[category] = [line.strip() for line in lines if line.strip()]

    # Create output files if they don't exist, preserving existing content
    for filename, header in categories.items():
        filepath = os.path.join(output_dir, filename)
        if not os.path.exists(filepath):
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(f"{header}\n")
                f.write("=" * len(header) + "\n\n")

    # Split text into lines and remove empty lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    remaining_lines = lines.copy()

    # Process one task at a time
    total_tasks = len(lines)
    with tqdm(total=total_tasks, desc="Analyzing tasks", unit="task") as pbar:
        for i, line in enumerate(lines, 1):
            try:
                print(f"\nProcessing task {i}/{total_tasks}:")
                print(f"Task: {line}")

                category = await analyze_eisenhower(line)
                print(f"Category: {category}")

                results[category].append(line)

                # Update the appropriate category file
                if category != "uncategorized":
                    filename = f"{category}.txt"
                    filepath = os.path.join(output_dir, filename)
                    print(f"Adding to {filename}")
                    with open(filepath, 'a', encoding='utf-8') as f:
                        # Preserve original text and append the rating/category
                        f.write(f"[{category.upper()}] {line}\n\n")

                # Remove the processed line from remaining_lines for progress tracking
                if line in remaining_lines:
                    remaining_lines.remove(line)

                # Don't modify input.txt - preserve original input text

                print(f"Tasks remaining: {len(remaining_lines)}")
                print("-" * 50)

                pbar.update(1)
                pbar.set_postfix({
                    'IMP+URG': len(results['important_urgent']),
                    'IMP': len(results['important']),
                    'UNIMP': len(results['unimportant'])
                })

            except Exception as e:
                print(f"\nError processing task: {str(e)}")
                print("You can resume from this point later.")
                break

    print("\nResults have been saved to:")
    for filename in categories.keys():
        print(f"- {filename}")

    print(f"\nTotal tasks processed: {total_tasks}")
    print("Original input.txt preserved with all original tasks intact.")

async def main():
    print("Eisenhower Matrix Task Analyzer")
    print("-" * 50)

    # Always use input.txt
    text = read_input_file("input.txt")

    if not text.strip():
        print("Error: input.txt is empty.")
        return

    print("\nProcessing tasks using Eisenhower Matrix...")
    await process_eisenhower(text)

if __name__ == "__main__":
    asyncio.run(main())
