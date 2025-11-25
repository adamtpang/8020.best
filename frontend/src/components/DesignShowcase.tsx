/**
 * Design System Showcase Component
 *
 * This component demonstrates the integration of:
 * 1. shadcn/ui components (New York style)
 * 2. Motion animations (Framer Motion)
 * 3. Coolors palette integration
 *
 * Use this as a reference for building new components
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  MotionWrapper,
  InteractiveMotion,
  StaggerContainer,
  StaggerItem,
} from '@/components/motion/motion-wrapper';
import { Sparkles, Zap, TrendingUp, Target } from 'lucide-react';

export default function DesignShowcase() {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5" />,
      title: 'shadcn/ui',
      description: 'Beautiful, accessible components',
      badge: 'New York Style',
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: 'Motion',
      description: 'Smooth, performant animations',
      badge: 'Framer Motion',
    },
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: 'Coolors',
      description: 'Curated color palettes',
      badge: 'CSS Variables',
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: 'TypeScript',
      description: 'Type-safe development',
      badge: 'Type Safety',
    },
  ];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header with fade-in animation */}
        <MotionWrapper variant="fadeIn" className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Design System Showcase
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A production-ready design stack combining shadcn/ui, Motion, and custom color palettes
          </p>
        </MotionWrapper>

        {/* Color Palette Demo */}
        <MotionWrapper variant="scaleIn" delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle>Color Palette</CardTitle>
              <CardDescription>
                Colors from your Coolors palette, accessible via CSS variables
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-2">
                  <div className="w-full h-20 rounded-lg bg-primary"></div>
                  <p className="text-sm font-medium">Primary</p>
                  <p className="text-xs text-muted-foreground">Indigo</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 rounded-lg bg-secondary"></div>
                  <p className="text-sm font-medium">Secondary</p>
                  <p className="text-xs text-muted-foreground">Purple</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 rounded-lg bg-accent"></div>
                  <p className="text-sm font-medium">Accent</p>
                  <p className="text-xs text-muted-foreground">Pink</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 rounded-lg bg-success"></div>
                  <p className="text-sm font-medium">Success</p>
                  <p className="text-xs text-muted-foreground">Emerald</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 rounded-lg bg-warning"></div>
                  <p className="text-sm font-medium">Warning</p>
                  <p className="text-xs text-muted-foreground">Amber</p>
                </div>
                <div className="space-y-2">
                  <div className="w-full h-20 rounded-lg bg-destructive"></div>
                  <p className="text-sm font-medium">Destructive</p>
                  <p className="text-xs text-muted-foreground">Red</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>

        {/* Button Variants with Interactive Motion */}
        <MotionWrapper variant="slideInFromLeft" delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Interactive Buttons</CardTitle>
              <CardDescription>
                shadcn/ui buttons with Motion hover and tap animations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <InteractiveMotion>
                  <Button variant="default">Primary Button</Button>
                </InteractiveMotion>
                <InteractiveMotion>
                  <Button variant="secondary">Secondary Button</Button>
                </InteractiveMotion>
                <InteractiveMotion>
                  <Button variant="outline">Outline Button</Button>
                </InteractiveMotion>
                <InteractiveMotion>
                  <Button variant="destructive">Destructive Button</Button>
                </InteractiveMotion>
                <InteractiveMotion>
                  <Button variant="ghost">Ghost Button</Button>
                </InteractiveMotion>
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>

        {/* Stagger Animation Demo */}
        <MotionWrapper variant="fadeIn" delay={0.4}>
          <Card>
            <CardHeader>
              <CardTitle>Stagger Animation</CardTitle>
              <CardDescription>
                List items animate in sequence with Motion stagger
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StaggerContainer className="grid md:grid-cols-2 gap-4">
                {features.map((feature, index) => (
                  <StaggerItem key={index}>
                    <InteractiveMotion>
                      <Card className="border-2 hover:border-primary transition-colors">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                {feature.icon}
                              </div>
                              <CardTitle className="text-lg">{feature.title}</CardTitle>
                            </div>
                            <Badge variant="secondary">{feature.badge}</Badge>
                          </div>
                          <CardDescription className="mt-2">
                            {feature.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </InteractiveMotion>
                  </StaggerItem>
                ))}
              </StaggerContainer>
            </CardContent>
          </Card>
        </MotionWrapper>

        {/* Form Example */}
        <MotionWrapper variant="slideInFromRight" delay={0.5}>
          <Card>
            <CardHeader>
              <CardTitle>Form Components</CardTitle>
              <CardDescription>
                shadcn/ui form components with custom styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <Input
                    id="message"
                    placeholder="Type your message"
                    className="w-full"
                  />
                </div>
                <InteractiveMotion>
                  <Button className="w-full">
                    Submit
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </InteractiveMotion>
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>

        {/* Code Reference */}
        <MotionWrapper variant="scaleIn" delay={0.6}>
          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle>Usage Reference</CardTitle>
              <CardDescription>
                Quick reference for using this design system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2">Import Motion Components:</h4>
                <code className="block p-3 bg-card rounded text-sm">
                  {`import { MotionWrapper, InteractiveMotion } from '@/components/motion/motion-wrapper';`}
                </code>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Import shadcn/ui:</h4>
                <code className="block p-3 bg-card rounded text-sm">
                  {`import { Button, Card } from '@/components/ui/button';`}
                </code>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2">Access Colors:</h4>
                <code className="block p-3 bg-card rounded text-sm">
                  {`className="bg-primary text-primary-foreground"`}
                </code>
              </div>
            </CardContent>
          </Card>
        </MotionWrapper>
      </div>
    </div>
  );
}
