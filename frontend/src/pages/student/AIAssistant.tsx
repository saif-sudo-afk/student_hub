import { AIConversation } from '@/components/common/AIConversation';

export function StudentAIAssistantPage() {
  return (
    <AIConversation
      title="Student AI Assistant"
      description="Ask about deadlines, concepts, grades, and where to find resources."
      chips={[
        { label: "What's due this week?", prompt: "What's due this week?" },
        { label: 'Explain a concept', prompt: 'Explain this concept in simple terms: [concept]' },
        { label: 'Where are my grades?', prompt: 'Where can I find my grades?' },
        { label: 'Help with my assignment', prompt: 'Help me break down this assignment: [assignment details]' },
      ]}
    />
  );
}
