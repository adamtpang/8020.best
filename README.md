# AI Task Filter

A command-line tool that helps prioritize and filter tasks using AI in two modes:
1. Eisenhower Matrix: Categorizes tasks by urgency and importance
2. Problem Vectors: Filters tasks based on how they address specific problems

## Requirements
- Python 3.7+
- Replicate API key (set in .env file)

## Setup
1. Create a `.env` file in the project root
2. Add your Replicate API key: `REPLICATE_API_TOKEN=your_key_here`

## Usage

### Prepare Input
1. Create a text file (e.g., `input.txt`) with your tasks/notes
2. Each line should be a separate task or note to analyze

### Text Preprocessing
The input text is automatically preprocessed before AI analysis:
- Removes duplicate lines
- Removes empty lines
- Sorts lines by character length (shortest to longest)
- Creates a new processed file with "_processed" suffix

You can also preprocess files separately using:
```bash
python preprocess.py input.txt [--output output.txt]
```

### Run the Program
1. Run `python main.py`
2. Choose filtering mode:
   - Mode 1: Eisenhower Matrix
     - Categorizes tasks into: do_first, schedule, delegate, eliminate
     - Based on urgency and importance
   - Mode 2: Problem Vectors
     - Enter up to 3 specific problems (e.g., debt, loneliness)
     - Tasks are filtered based on how they address these problems
3. Enter the name of your input file

### Results
- Eisenhower Matrix mode:
  - Results saved in `eisenhower_matrix` directory
  - Categories:
    - do_first: urgent and important
    - schedule: important, not urgent
    - delegate: urgent, not important
    - eliminate: neither urgent nor important
    - uncategorized: processing errors

- Problem Vectors mode:
  - Results saved in `problem_vectors` directory
  - A file for each specified problem
  - `none.txt` for tasks that don't address any problems

### Note
Tasks are never deleted, only categorized and filtered. All input is preserved across different categories, making it easy to review and reprioritize as needed.