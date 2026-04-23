import { AIConversation } from '@/components/common/AIConversation';

export function ProfessorAIAssistantPage() {
  return (
    <AIConversation
      title="Professor AI Assistant"
      description="Use structured prompts for assignment briefs, exam questions, feedback, and class summaries."
      chips={[
        {
          label: 'Write assignment brief',
          prompt: 'Write a clear assignment brief for [topic]. Include: objectives, deliverables, deadline instructions, and grading criteria.',
        },
        {
          label: 'Generate exam questions',
          prompt: 'Generate 10 exam questions (mix of MCQ and short answer) for the topic: [topic]. Include an answer key.',
        },
        {
          label: 'Write student feedback',
          prompt: 'Write constructive feedback for a student who scored [score]/[max] on [assignment]. Tone: encouraging but honest.',
        },
        {
          label: 'Summarize class performance',
          prompt: 'Summarize the following grade data and identify students who may need extra support: [paste data].',
        },
      ]}
    />
  );
}
