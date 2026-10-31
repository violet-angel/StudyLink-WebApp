export type CatalogResourceType =
  | 'Note'
  | 'PDF'
  | 'Podcast'
  | 'Video'
  | 'MCQ'
  | 'Past Paper'
  | 'Guide';

export type CatalogResource = {
  id: string;
  courseCode: string;
  title: string;
  type: CatalogResourceType;
  description: string;
  audience: string;
  usageNotes: string;
  duration?: string;
  url: string;
  fallbackUrl?: string;
};

export type CatalogCourse = {
  id: number;
  code: string;
  title: string;
  category: string;
  school: string;
  program: string;
  description: string;
  level: string;
  deliveryMode: string;
  image: string;
  supportFocus: string;
  topics: string[];
  objectives: string[];
  aiPrompts: string[];
  resources: CatalogResource[];
};

export type StudyLinkAiResponse = {
  headline: string;
  explanation: string;
  nextSteps: string[];
  focusAreas: string[];
  studyTips: string[];
  recommendedResources: CatalogResource[];
  peerAdvice: string;
  externalLinks?: Array<{ label: string; url: string }>;
};

type CourseSeed = Omit<CatalogCourse, 'resources'> & {
  noteTopics: string[];
  pdfTitles: string[];
  podcastTopics: string[];
  videoTopics: string[];
  mcqTopics: string[];
  paperTopics: string[];
};

const ENROLLMENT_STORAGE_KEY = 'studylink_supplemental_course_enrollments_v1';

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDataUrl(title: string, bodyHtml: string) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: #f8fafc; margin: 0; padding: 2rem; }
  .page { max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 1rem; box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08); padding: 2.5rem; }
  h1 { margin: 0 0 1.25rem; font-size: 2.2rem; letter-spacing: -0.03em; }
  h2 { margin: 2rem 0 1rem; font-size: 1.25rem; color: #1e293b; }
  p { margin: 0 0 1rem; color: #334155; line-height: 1.7; }
  ul, ol { margin: 0 0 1rem 1.5rem; color: #334155; }
  li { margin: 0.5rem 0; }
  .section { margin-bottom: 1.75rem; }
  .section-title { display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; color: #0f172a; }
  .note-box, .pdf-box, .media-box, .question-box, .answer-box { background: #f1f5f9; border-radius: 0.85rem; padding: 1rem 1.25rem; margin: 1rem 0; }
  .question-box strong, .answer-box strong { display: block; margin-bottom: 0.75rem; }
  .resource-footer { border-top: 1px solid #e2e8f0; padding-top: 1rem; color: #475569; font-size: 0.95rem; }
  .definition-list dt { font-weight: 700; margin-top: 1rem; }
  .definition-list dd { margin: 0 0 0.75rem 1.5rem; }
</style>
</head>
<body>
  <div class="page">
    <h1>${escapeHtml(title)}</h1>
    ${bodyHtml}
  </div>
</body>
</html>`;
  return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
}

function buildYoutubeSearchUrl(query: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function buildPodcastSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(`${query} podcast`)}`;
}

function buildGoogleSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildPdfSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' filetype:pdf')}`;
}

function buildNotesSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' notes')}`;
}

function buildScholarSearchUrl(query: string) {
  return `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`;
}

function buildMcqSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' MCQ questions')}`;
}

function buildPaperSearchUrl(query: string) {
  return `https://www.google.com/search?q=${encodeURIComponent(query + ' past paper')}`;
}

function buildSection(title: string, contentHtml: string) {
  return `<section class="section"><h2 class="section-title">${escapeHtml(title)}</h2>${contentHtml}</section>`;
}

function buildParagraph(text: string) {
  return `<p>${escapeHtml(text)}</p>`;
}

function buildList(items: string[]) {
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
}

function buildDefinitionList(items: Array<[string, string]>) {
  return `<dl class="definition-list">${items.map(([term, definition]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(definition)}</dd>`).join('')}</dl>`;
}

function buildQuestionBlock(question: string, choices: string[]) {
  return `<div class="question-box"><strong>${escapeHtml(question)}</strong><ol type="A">${choices.map((choice) => `<li>${escapeHtml(choice)}</li>`).join('')}</ol></div>`;
}

function buildMcqQuestionBlock(question: string, choices: string[], correctIndex: number, explanation: string) {
  const correctLabel = String.fromCharCode(65 + correctIndex);
  return `<div class="question-box"><strong>${escapeHtml(question)}</strong><ol type="A">${choices.map((choice) => `<li>${escapeHtml(choice)}</li>`).join('')}</ol><div class="answer-box"><strong>Correct answer: ${escapeHtml(correctLabel)}</strong><p>${escapeHtml(choices[correctIndex])}</p><strong>Why this is best</strong><p>${escapeHtml(explanation)}</p></div></div>`;
}

function buildAnswerBlock(answerText: string) {
  return `<div class="answer-box"><strong>Answer</strong><p>${escapeHtml(answerText)}</p></div>`;
}

function buildFooter(text: string) {
  return `<div class="resource-footer">${escapeHtml(text)}</div>`;
}

function buildNoteContent(seed: CourseSeed, topic: string) {
  return buildDataUrl(`${seed.code} Study Note: ${topic}`,
    buildSection('Overview', buildParagraph(`This note is organised into a clear topic roadmap with related subtopics and detailed explanations. It explains ${topic.toLowerCase()} as a concept, shows how it appears in ${seed.title}, and gives students the structure they need for confident answers.`)) +
    buildSection('Why this topic matters', buildParagraph(`In ${seed.title}, ${topic.toLowerCase()} appears in lectures, assignments, and exam questions. This section explains why it is central to understanding the course and how it supports decision-making in practical tasks.`)) +
    buildSection('Topic roadmap', buildList([
      `Subtopic 1: Core definition and purpose of ${topic.toLowerCase()}.`,
      `Subtopic 2: Practical applications and examples in ${seed.title}.`,
      `Subtopic 3: Common pitfalls, comparisons, and evaluation advice.`,
    ])) +
    buildSection(`Subtopic 1: Definition and concept`, buildParagraph(`${topic.toLowerCase()} is best understood as a specific idea or method that solves part of the course problem. In this subtopic, we clarify its meaning, how it differs from related concepts, and the precise terms examiners want to see.`)) +
    buildSection(`Subtopic 2: Practical application`, buildParagraph(`This subtopic shows how to apply ${topic.toLowerCase()} in ${seed.title}. It explains a typical scenario, the steps required, and the reasoning behind each step so students can write a well-supported answer.`)) +
    buildSection('Application steps', `<div class="note-box">${escapeHtml(`Use these stages when applying the topic:`)}<br/><br/>${escapeHtml(`1. Identify the problem requirement.
2. Select the relevant part of the topic.
3. Explain how it solves the task.
4. Provide a short example or illustration.
5. Evaluate why the choice is appropriate.`).replace(/\n/g, '<br/>')}</div>`) +
    buildSection(`Subtopic 3: Common pitfalls and comparison`, buildParagraph(`Students often confuse ${topic.toLowerCase()} with similar ideas or stop at a definition. This section explains the common mistakes, how to compare it with related topics, and what to include to make the answer stronger.`)) +
    buildSection('Comparison checklist', buildList([
      `Describe what ${topic.toLowerCase()} is not, as well as what it is.`,
      'Link it to a related course concept and explain the difference.',
      'Show why the chosen approach is better in this situation.',
    ])) +
    buildSection('Worked example', buildParagraph(`Example: A student is asked to use ${topic.toLowerCase()} in a practical task. The response below shows the structure of a strong answer and the exact reasoning needed.`)) +
    buildSection('Example walkthrough', `<div class="note-box">${escapeHtml(`Example walkthrough:`)}<br/><br/>${escapeHtml(`1. Start with a sentence defining the topic.
2. Describe the context of the task.
3. Explain the selected method and why it applies.
4. Show one example or outcome.
5. Add a short evaluation or conclusion.`).replace(/\n/g, '<br/>')}</div>`) +
    buildSection('Detailed explanation', buildParagraph(`A complete answer should explain each subtopic clearly. This means defining the concept, applying it in a scenario, comparing it with alternatives, and evaluating the result so the examiner understands the reasoning.`)) +
    buildSection('Study checklist', buildList([
      'Write the definition in your own words.',
      'Add at least one practical example.',
      'Compare it to a related idea to avoid mix-ups.',
      'Include one short statement of why this approach works.',
    ])) +
    buildSection('Revision prompts', buildList([
      `What are the three key points you should remember about ${topic.toLowerCase()}?`,
      'Which example best shows the topic in action?',
      'Where does this topic fit in the course structure and why?',
    ])) +
    buildFooter(`This note is structured to teach ${topic.toLowerCase()} through topic, subtopic, application, and explanation so students learn the concept thoroughly.`),
  );
}

function buildPdfContent(seed: CourseSeed, title: string) {
  return buildDataUrl(`${seed.code} PDF Guide: ${title}`,
    buildSection('Executive summary', buildParagraph(`This PDF guide is a fully researched study resource for ${seed.title}. It brings together the key theory, literature review, practical examples, and revision strategy so that learners can use it as a complete answer reference.`)) +
    buildSection('Why this matters', buildParagraph(`${title} is important because it appears in the course’s core assessment objectives and helps students demonstrate both understanding and application. This guide explains why the topic is valuable and how it should be used in assignments.`)) +
    buildSection('Literature review', buildParagraph(`Course and academic literature often frame this topic in terms of problem solving, evaluation, and justification. This section summarises the most relevant perspectives and the reason they are emphasised in ${seed.title}.`)) +
    buildSection('Core definitions', buildDefinitionList([
      [`${seed.code} concept`, `A clear description of the topic and how it functions within the course.`],
      ['Practical application', 'How and where this topic is used in assignments, projects, or exam questions.'],
      ['Evaluation criteria', 'The elements lecturers look for in a strong answer.'],
    ])) +
    buildSection('Application example', `<div class="pdf-box">${escapeHtml(`Application example: This section walks through a real course-style problem step by step, showing how to use the topic effectively.`)}<br/><br/>${escapeHtml(`Scenario: A student must solve or evaluate a task related to ${title.toLowerCase()}. The answer should define the concept, show how it applies, and explain why it is correct.`).replace(/\n/g, '<br/>')}</div>`) +
    buildSection('Research implications', buildParagraph(`The key implication for students is that a strong answer combines concept, example, and justification. This guide emphasises the reasoning and evidence that make the response convincing.`)) +
    buildSection('Comparison with related topics', buildList([
      `Why ${title.toLowerCase()} is different from similar course topics.`,
      'When to use this topic instead of another one.',
      'How to avoid mixing up concepts in exam answers.',
    ])) +
    buildSection('Revision strategy', buildList([
      'Read the summary and write the main terms in your own words.',
      'Rewrite the application example from memory.',
      'Use the comparison section to test your concept distinctions.',
      'Practice one sample question using the guide.',
    ])) +
    buildFooter(`This PDF resource is created to be a deep, teacher-quality study document for ${seed.code}.`),
  );
}

function buildPodcastContent(seed: CourseSeed, topic: string) {
  return buildDataUrl(`${seed.code} Podcast Notes: ${topic}`,
    buildSection('Episode summary', buildParagraph(`This podcast-style resource is written like a researched lecture notes page. It provides the topic, the underlying research idea, and the practical conclusion so listeners can capture the essential learning in one place.`)) +
    buildSection('Research context', buildParagraph(`Studies and course materials show that listening with purpose improves retention. This section summarises the key research idea behind ${topic.toLowerCase()} and the lessons students need for ${seed.title}.`)) +
    buildSection('Main points', buildList([
      `What ${topic.toLowerCase()} means and why it is important in ${seed.title}.`,
      'The strongest example that helps make the concept memorable.',
      'A clear study tip to apply it during revision.',
    ])) +
    buildSection('Detailed explanation', `<div class="media-box">${escapeHtml(`Detailed explanation: Write this as if the student is listening to a tutor explain the topic step by step.`)}<br/><br/>${escapeHtml(`1. Introduce the topic simply.
2. Explain how it connects to the course.
3. Show one strong example.
4. Highlight the most important takeaway.`).replace(/\n/g, '<br/>')}</div>`) +
    buildSection('Reflection prompts', buildList([
      'What is the one sentence summary you would use for this topic?',
      'How does it apply to the next assignment or exam?',
      'What action should you take after listening to this resource?',
    ])) +
    buildFooter(`This podcast notes page is designed to be a deep, research-style learning resource for ${seed.code}.`),
  );
}

function buildVideoContent(seed: CourseSeed, topic: string) {
  return buildDataUrl(`${seed.code} Video Companion: ${topic}`,
    buildSection('Visual summary', buildParagraph(`This companion content is written like a video study guide. It explains the topic, highlights the key visual steps, and identifies the exact research-backed evidence students should focus on while watching.`)) +
    buildSection('Research highlights', buildList([
      'The topic is explained in a stepwise process.',
      'A common mistake is compared with the recommended approach.',
      'The visual cues are tied to the course learning objectives.',
    ])) +
    buildSection('Video walkthrough', `<div class="media-box">${escapeHtml(`Video walkthrough: This section describes the flow of a typical explanatory video, including what students should pause on and what to summarise.`)}<br/><br/>${escapeHtml(`1. Start with the topic definition.
2. Show a concrete example.
3. Highlight the key decision points.
4. Summarise the evidence and conclusion.`).replace(/\n/g, '<br/>')}</div>`) +
    buildSection('Study actions', buildList([
      'Pause after each major point and write a one-sentence summary.',
      'Draw the concept or process diagram discussed in the video.',
      'Note one application example and one caution or limitation.',
    ])) +
    buildFooter(`This video companion is created to feel like a full lecture-support resource for ${seed.code}.`),
  );
}

function buildMcqContent(seed: CourseSeed, topic: string) {
  return buildDataUrl(`${seed.code} MCQ Drill: ${topic}`,
    buildSection('Practice questions', buildParagraph(`This MCQ drill provides a structured study exercise with clear rationale and answer review. It is written to feel like exam preparation material from a course tutor.`)) +
    buildMcqQuestionBlock(`In ${seed.title}, which description best captures ${topic.toLowerCase()}?`, [
      'A practical method used for solving the course problem.',
      'A vague statement with no application.',
      'A historical definition unrelated to the topic.',
      'A list of terms without meaning.',
    ], 0, `This answer is best because it directly matches the course emphasis on applying the concept to solve actual problems, while the other choices are vague or off-topic.`) +
    buildMcqQuestionBlock(`When applying ${topic.toLowerCase()} in a real task, what should you do first?`, [
      'Choose the first idea that comes to mind.',
      'Identify the problem requirement and select the appropriate approach.',
      'Write a long answer without a plan.',
      'Ignore the context and use a memorised formula.',
    ], 1, `This answer is best because the first step in a strong solution is understanding the problem before selecting the correct approach; the other choices ignore the context or lead to unfocused work.`) +
    buildMcqQuestionBlock(`Which student answer shows the strongest reasoning for ${topic.toLowerCase()}?`, [
      'A short definition only.',
      'A definition with an example and justification.',
      'A list of unrelated facts.',
      'A vague statement about the topic.',
    ], 1, `The strongest answer includes a definition, a relevant example, and a justification, which matches what examiners expect from a course-based response.`) +
    buildMcqQuestionBlock(`What is the most important benefit of using ${topic.toLowerCase()} correctly?`, [
      'It helps solve the specific task accurately.',
      'It makes the answer longer.',
      'It sounds more impressive.',
      'It avoids all errors automatically.',
    ], 0, `The correct benefit is that the concept helps solve the task accurately; the other choices confuse length, style, and certainty with actual effectiveness.`) +
    buildMcqQuestionBlock(`How should you present ${topic.toLowerCase()} in an exam answer?`, [
      'With a clear explanation of why it is used.',
      'With only a definition and no example.',
      'By copying a textbook sentence.',
      'By writing a very short phrase.',
    ], 0, `A strong exam answer explains the concept and why it is used, while the others lack explanation, originality, or sufficient context.`) +
    buildMcqQuestionBlock(`Which phrase best avoids a common mistake when applying ${topic.toLowerCase()}?`, [
      'Use the concept with an example and reasoned justification.',
      'State the concept quickly and stop.',
      'Repeat the question as the answer.',
      'Assume the reader already understands it.',
    ], 0, `This choice avoids the common mistake of giving a shallow response by insisting on example and justification.`) +
    buildMcqQuestionBlock(`When comparing ${topic.toLowerCase()} to a related idea, you should:`, [
      'Explain both clearly and note the key difference.',
      'Choose one and ignore the other.',
      'Use both interchangeably without distinction.',
      'Avoid the comparison altogether.',
    ], 0, `The correct strategy is to explain both ideas clearly and identify their difference, which demonstrates understanding and prevents confusion.`) +
    buildMcqQuestionBlock(`A strong revision strategy for ${topic.toLowerCase()} is to:`, [
      'Rewrite the idea in your own words and practise examples.',
      'Memorise the textbook sentence exactly.',
      'Skip it if it feels difficult.',
      'Only read the headings and not the details.',
    ], 0, `The best revision strategy is active recall and application, not passive memorisation or avoidance.`) +
    buildMcqQuestionBlock(`In a group discussion, the most useful way to review ${topic.toLowerCase()} is to:`, [
      'Share one example, compare reasoning, and clarify differences.',
      'Agree quickly without discussing details.',
      'Focus only on the hardest parts.',
      'Tell others the answer is obvious.',
    ], 0, `Sharing examples and comparing reasoning helps the whole group understand the concept deeply and catch misunderstandings.`) +
    buildMcqQuestionBlock(`Which statement shows the best use of ${topic.toLowerCase()} in a practical problem?`, [
      'Identify the requirement, apply the concept, and explain why it solves the task.',
      'Describe the concept without linking it to the problem.',
      'State an unrelated fact and move on.',
      'Write the question again as the answer.',
    ], 0, `The best use links the concept directly to the requirement and explains the reason, which is what exam-quality answers need.`) +
    buildMcqQuestionBlock(`Why should you include a short evaluation when explaining ${topic.toLowerCase()}?`, [
      'It shows awareness of strengths, limits, and real application.',
      'It makes the answer look more complex.',
      'It fills space in the answer.',
      'It proves the topic is always perfect.',
    ], 0, `A short evaluation shows higher-order thinking by acknowledging strengths and limits, rather than adding complexity or filler.`) +
    buildMcqQuestionBlock(`Which revision note is most useful for remembering ${topic.toLowerCase()}?`, [
      'A concise summary plus one practical example.',
      'A long, unfocused paragraph.',
      'A list of unrelated terms.',
      'A sentence with no application.',
    ], 0, `A concise summary with an example is the most useful because it combines concept understanding with application.`) +
    buildMcqQuestionBlock(`When an exam question asks for ${topic.toLowerCase()} and an example, your best response is:`, [
      'Define the concept and give a specific, relevant example.',
      'Give a generic statement and no example.',
      'Write only the example without the definition.',
      'Answer with an unrelated concept.',
    ], 0, `The best response includes both a definition and a relevant example, matching the question requirements fully.`) +
    buildMcqQuestionBlock(`What makes an answer about ${topic.toLowerCase()} stand out to markers?`, [
      'Clear structure, correct reasoning, and practical application.',
      'Long sentences and complex language.',
      'Different terminology from the course.',
      'A short answer with no detail.',
    ], 0, `Markers value clarity, reasoning, and application over length or complexity, so this is the strongest choice.`) +
    buildSection('Study tips', buildList([
      'Review your reasoning after each question.',
      'Compare your answer to the course definition.',
      'Use the explanations to correct any misunderstandings.',
    ])) +
    buildFooter(`This MCQ resource is designed to feel like a high-quality study pack for ${seed.code}.`),
  );
}

function buildPaperContent(seed: CourseSeed, topic: string) {
  return buildDataUrl(`${seed.code} Past Paper: ${topic}`,
    buildSection('Topic overview', buildParagraph(`This past paper resource is arranged by topic and subtopic so students can see how ${topic.toLowerCase()} should be explained in a structured written response. It includes concept guidance, practical examples, and exam-ready question prompts.`)) +
    buildSection('Subtopic roadmap', buildList([
      `Subtopic A: What ${topic.toLowerCase()} means in ${seed.title}.`,
      `Subtopic B: How to apply it in a practical task.`,
      `Subtopic C: How to compare it with alternatives and evaluate the result.`,
    ])) +
    buildSection('Subtopic A: Concept definition', buildParagraph(`Begin by defining ${topic.toLowerCase()} clearly and connecting it to the course objective. Explain the key terms, why this concept matters, and what it enables the student to do in the task.`)) +
    buildSection('Subtopic B: Practical application', buildParagraph(`Next, show how the topic is used in a real scenario. Describe the steps involved, the expected outcome, and how this approach addresses the problem effectively.`)) +
    buildSection('Subtopic C: Comparison and evaluation', buildParagraph(`Finish with a short comparison or evaluation. Explain how this topic is stronger than or different from a related idea, and mention any limitations or conditions for success.`)) +
    buildSection('Question one', buildParagraph(`Explain the role of ${topic.toLowerCase()} in a practical ${seed.title} scenario and provide a concrete example. Your answer should cover the concept, the application, and a short evaluation.`)) +
    buildSection('Question two', buildParagraph(`Compare two practical approaches to solving a problem that involves ${topic.toLowerCase()}. Describe when each approach is appropriate and how they differ in terms of outcome or ease of use.`)) +
    buildSection('Answer structure', buildList([
      'Introduction: define the topic and set the context.',
      'Body part 1: explain the main concept clearly.',
      'Body part 2: give a practical example or step-by-step application.',
      'Body part 3: compare alternatives and evaluate the chosen method.',
      'Conclusion: summarise the answer and link back to the question.',
    ])) +
    buildSection('Example guidance', buildParagraph(`Use this structure for both questions. For Question one, focus on the concept, example, and why it solves the task. For Question two, compare two methods and explain which is more suitable under which conditions.`)) +
    buildSection('Exam tips', buildList([
      'Use clear subheadings in your mind as you plan the answer.',
      'Keep each paragraph focused on one idea or subtopic.',
      'Include one real or course-related example for each main point.',
      'Write a short conclusion that restates the best choice and why it works.',
    ])) +
    buildFooter(`This past paper guide is designed to make ${topic.toLowerCase()} easy to structure, explain, and evaluate in ${seed.code} exam-style answers.`),
  );
}

function buildGuideContent(seed: CourseSeed) {
  return buildDataUrl(`${seed.code} Group Support Guide`,
    buildSection('Study workflow', buildParagraph(`This guide describes a complete study workflow for ${seed.title}. It shows how to combine notes, PDF guides, podcasts, videos, and practice resources into one cohesive learning path.`)) +
    buildSection('Resource sequence', buildList([
      'Start with notes to understand the core theory.',
      'Use PDFs for structured summaries and examples.',
      'Listen to podcasts for a conversational review.',
      'Watch videos to visualise the concepts.',
      'Practice with MCQs and past paper questions.',
    ])) +
    buildSection('Group tactic', buildParagraph(`In group study, share your summaries, compare answers, and discuss the reasoning behind each approach. This helps turn individual understanding into a shared, problem-solving outcome.`)) +
    buildSection('Key outcome', buildList([
      'A deep understanding of the topic.',
      'A shared example everyone can explain.',
      'A list of follow-up questions for StudyLink AI.',
    ])) +
    buildFooter(`This guide is designed to make the platform feel like a full solution system for ${seed.code}.`),
  );
}

const podcastLinkOverrides: Record<string, string> = {
};

const videoLinkOverrides: Record<string, string> = {
  'ACC210|Ledger posting walkthrough': 'https://www.youtube.com/shorts/gopqOQnHzAY',
  'ACC210|Statement preparation visual guide': 'https://www.youtube.com/shorts/tIzBVa8zqto',
};

const noteLinkOverrides: Record<string, string> = {
  // Add exact note URLs here if you want to pin them for a course.
};

const pdfLinkOverrides: Record<string, string> = {
  // If you have exact PDF resources, add them here.
};

const paperLinkOverrides: Record<string, string> = {
  // Add exact past paper URLs here if needed.
};

const mcqLinkOverrides: Record<string, string> = {
  // Add exact MCQ links here if needed.
};

// Podcast overrides (search-friendly fallbacks)
// Add curated podcast links here if available.

function createResources(seed: CourseSeed): CatalogResource[] {
  const noteResources = seed.noteTopics.map((topic, index) => {
    const overrideKey = `${seed.code}|${topic}`;
    const externalUrl = noteLinkOverrides[overrideKey] ?? buildNotesSearchUrl(`${seed.title} ${topic}`);
    const inApp = buildNoteContent(seed, topic);

    return {
      id: `${seed.code}-note-${index + 1}`,
      courseCode: seed.code,
      title: `${seed.code} Note ${index + 1}: ${topic}`,
      type: 'Note' as const,
      description: `Structured study notes for ${topic} in ${seed.title}.`,
      audience: `${seed.program} learners`,
      usageNotes: 'Open the curated external note; use the in-app note as a quick summary.',
      url: externalUrl,
      fallbackUrl: inApp,
    };
  });

  const pdfResources = seed.pdfTitles.map((title, index) => {
    const overrideKey = `${seed.code}|${title}`;
    const externalUrl = pdfLinkOverrides[overrideKey] ?? buildPdfSearchUrl(`${seed.title} ${title}`);
    const inApp = buildPdfContent(seed, title);

    return {
      id: `${seed.code}-pdf-${index + 1}`,
      courseCode: seed.code,
      title: `${seed.code} PDF ${index + 1}: ${title}`,
      type: 'PDF' as const,
      description: `${title} prepared for ${seed.title}.`,
      audience: 'All enrolled students',
      usageNotes: 'Open the curated external PDF/resource; the in-app PDF gives a concise guide.',
      url: externalUrl,
      fallbackUrl: inApp,
    };
  });

  const podcastResources = seed.podcastTopics.map((topic, index) => {
    const overrideKey = `${seed.code}|${topic}`;
    const externalUrl = podcastLinkOverrides[overrideKey] ?? buildPodcastSearchUrl(`${seed.title} ${topic}`);
    const inApp = buildPodcastContent(seed, topic);

    return {
      id: `${seed.code}-podcast-${index + 1}`,
      courseCode: seed.code,
      title: `${seed.code} Podcast ${index + 1}: ${topic}`,
      type: 'Podcast' as const,
      description: `Audio-style revision guide covering ${topic.toLowerCase()}.`,
      audience: 'Students revising beyond class hours',
      usageNotes: 'Open the curated external podcast; use the in-app notes for a concise summary.',
      duration: '12-18 min',
      url: externalUrl,
      fallbackUrl: inApp,
    };
  });

  const videoResources = seed.videoTopics.map((topic, index) => {
    const overrideKey = `${seed.code}|${topic}`;
    const externalUrl = videoLinkOverrides[overrideKey] ?? buildYoutubeSearchUrl(`${seed.title} ${topic}`);
    const inApp = buildVideoContent(seed, topic);

    return {
      id: `${seed.code}-video-${index + 1}`,
      courseCode: seed.code,
      title: `${seed.code} Video Guide ${index + 1}: ${topic}`,
      type: 'Video' as const,
      description: `Visual explanation pack for ${topic.toLowerCase()}.`,
      audience: 'Visual learners',
      usageNotes: 'Open the curated external video/search; use the in-app guide for a concise walkthrough.',
      duration: '8-14 min',
      url: externalUrl,
      fallbackUrl: inApp,
    };
  });

  const mcqResources = seed.mcqTopics.map((topic, index) => {
    const overrideKey = `${seed.code}|${topic}`;
    const externalUrl = mcqLinkOverrides[overrideKey] ?? buildMcqSearchUrl(`${seed.title} ${topic}`);
    const inApp = buildMcqContent(seed, topic);

    return {
      id: `${seed.code}-mcq-${index + 1}`,
      courseCode: seed.code,
      title: `${seed.code} MCQ Drill ${index + 1}: ${topic}`,
      type: 'MCQ' as const,
      description: `Practice questions for ${topic.toLowerCase()} in ${seed.title}.`,
      audience: 'Students preparing for exams',
      usageNotes: 'Open the curated external MCQ; use the in-app drill for immediate practice and explanations.',
      url: externalUrl,
      fallbackUrl: inApp,
    };
  });

  const paperResources = seed.paperTopics.map((topic, index) => {
    const overrideKey = `${seed.code}|${topic}`;
    const externalUrl = paperLinkOverrides[overrideKey] ?? buildPaperSearchUrl(`${seed.title} ${topic}`);
    const inApp = buildPaperContent(seed, topic);

    return {
      id: `${seed.code}-paper-${index + 1}`,
      courseCode: seed.code,
      title: `${seed.code} Past Paper ${index + 1}: ${topic}`,
      type: 'Past Paper' as const,
      description: `Exam-style practice paper focused on ${topic.toLowerCase()}.`,
      audience: 'Revision groups and independent learners',
      usageNotes: 'Open the curated external past paper; use the in-app past paper for quick practice.',
      url: externalUrl,
      fallbackUrl: inApp,
    };
  });

  const guideResource: CatalogResource = {
    id: `${seed.code}-guide-1`,
    courseCode: seed.code,
    title: `${seed.code} Group Support Guide`,
    type: 'Guide',
    description: `Peer-support roadmap showing how to use StudyLink for ${seed.title}.`,
    audience: 'Students who feel stuck in the course',
    usageNotes: 'Start here if you do not know which resource to open first.',
    url: buildGuideContent(seed),
  };

  return [
    ...noteResources,
    ...pdfResources,
    ...podcastResources,
    ...videoResources,
    ...mcqResources,
    ...paperResources,
    guideResource,
  ];
}

const courseSeeds: CourseSeed[] = [
  {
    id: 1,
    code: 'APT3060',
    title: 'Mobile Programming',
    category: 'Applied Computer Technology',
    school: 'School of Science and Technology',
    program: 'Applied Computer Technology',
    description: 'Design mobile learning experiences, connect APIs, manage storage, and build polished user interfaces.',
    level: 'Year 4',
    deliveryMode: 'Blended',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping students turn difficult mobile architecture concepts into practical revision steps.',
    topics: ['Android architecture basics', 'State management', 'API integration', 'Room storage', 'Testing and debugging'],
    objectives: ['Build stable mobile flows', 'Explain architecture patterns clearly', 'Prepare for implementation exams and demos'],
    aiPrompts: ['Explain MVVM in simple terms', 'Give me notes on Retrofit and Room', 'Create a quiz on lifecycle management'],
    noteTopics: ['MVVM and state management', 'Retrofit networking flow', 'Room database revision'],
    pdfTitles: ['Course outline and weekly plan', 'Mobile UI design checklist'],
    podcastTopics: ['Understanding mobile architecture without fear', 'How to remember API and storage workflows'],
    videoTopics: ['Lifecycle walkthrough', 'Navigation and state visual guide'],
    mcqTopics: ['Activity lifecycle', 'Data persistence'],
    paperTopics: ['Architecture patterns and debugging', 'API, storage, and UI integration'],
  },
  {
    id: 2,
    code: 'APT3025',
    title: 'Machine Learning',
    category: 'Applied Computer Technology',
    school: 'School of Science and Technology',
    program: 'Applied Computer Technology',
    description: 'Study supervised learning, evaluation, features, and model interpretation through practical academic use cases.',
    level: 'Year 4',
    deliveryMode: 'Online',
    image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Making abstract AI and model-evaluation ideas easier to discuss and practice with peers.',
    topics: ['Regression', 'Classification', 'Model evaluation', 'Feature engineering', 'Bias and variance'],
    objectives: ['Interpret core ML models', 'Evaluate model performance', 'Revise AI concepts with confidence'],
    aiPrompts: ['Explain overfitting', 'Give me notes on confusion matrix', 'Create revision questions for regression'],
    noteTopics: ['Regression fundamentals', 'Classification and confusion matrix', 'Bias, variance, and model tuning'],
    pdfTitles: ['ML formulas quick sheet', 'Evaluation metrics handbook'],
    podcastTopics: ['Machine learning for non-experts', 'Remembering metrics before exams'],
    videoTopics: ['How supervised learning works', 'Visualizing underfitting and overfitting'],
    mcqTopics: ['Model evaluation', 'Feature engineering'],
    paperTopics: ['Regression and classification', 'Metrics and model improvement'],
  },
  {
    id: 3,
    code: 'CS201',
    title: 'Data Structures and Algorithms',
    category: 'Computer Science',
    school: 'School of Science and Technology',
    program: 'Computer Science',
    description: 'Learn arrays, linked structures, recursion, searching, sorting, and algorithmic problem solving.',
    level: 'Year 2',
    deliveryMode: 'In-Person',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Breaking down problem-solving anxiety through repeated guided practice.',
    topics: ['Arrays and linked lists', 'Stacks and queues', 'Trees and graphs', 'Sorting', 'Algorithm analysis'],
    objectives: ['Choose the right data structure', 'Trace algorithms correctly', 'Improve exam speed and logic'],
    aiPrompts: ['Teach me recursion', 'Give me tree traversal notes', 'Quiz me on Big O'],
    noteTopics: ['Recursion fundamentals', 'Tree traversal strategies', 'Big O analysis'],
    pdfTitles: ['Sorting algorithms cheat sheet', 'Data structure comparison table'],
    podcastTopics: ['How to think through algorithm questions', 'Beating recursion confusion'],
    videoTopics: ['Stack and queue visual explanation', 'Binary tree traversal animation guide'],
    mcqTopics: ['Algorithm complexity', 'Trees and graphs'],
    paperTopics: ['Sorting and searching', 'Recursion and complexity'],
  },
  {
    id: 4,
    code: 'BUS101',
    title: 'Introduction to Business',
    category: 'Business',
    school: 'School of Business',
    program: 'Business Administration',
    description: 'Understand entrepreneurship, operations, strategy, value creation, and business communication.',
    level: 'Year 1',
    deliveryMode: 'Blended',
    image: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping first-year business students connect theory to real commercial examples.',
    topics: ['Business environment', 'Entrepreneurship', 'Management functions', 'Marketing basics', 'Operations'],
    objectives: ['Explain core business terms', 'Analyze simple case studies', 'Present business ideas confidently'],
    aiPrompts: ['Summarize entrepreneurship', 'Help me understand management functions', 'Create case study questions'],
    noteTopics: ['Business environment basics', 'Entrepreneurship overview', 'Management functions'],
    pdfTitles: ['Business terms handbook', 'Case study analysis template'],
    podcastTopics: ['Business concepts in everyday language', 'Preparing for business presentations'],
    videoTopics: ['Management functions explained', 'Marketing mix visual summary'],
    mcqTopics: ['Entrepreneurship and strategy', 'Marketing principles'],
    paperTopics: ['Case study interpretation', 'Business environment and management'],
  },
  {
    id: 5,
    code: 'ACC210',
    title: 'Financial Accounting',
    category: 'Accounting',
    school: 'School of Business',
    program: 'Accounting and Finance',
    description: 'Practice journal entries, ledgers, trial balances, and statement preparation with clear accounting logic.',
    level: 'Year 2',
    deliveryMode: 'Lecture + Tutorial',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Reducing accounting panic by turning calculations into repeatable steps.',
    topics: ['Double entry', 'Ledgers', 'Trial balance', 'Income statement', 'Balance sheet'],
    objectives: ['Record transactions correctly', 'Prepare financial statements', 'Spot and correct accounting errors'],
    aiPrompts: ['Explain double entry simply', 'Give me ledger notes', 'Quiz me on trial balance'],
    noteTopics: ['Double entry rules', 'Trial balance preparation', 'Financial statements overview'],
    pdfTitles: ['Accounting formula sheet', 'Ledger practice pack'],
    podcastTopics: ['Understanding debits and credits', 'How to avoid accounting mistakes'],
    videoTopics: ['Ledger posting walkthrough', 'Statement preparation visual guide'],
    mcqTopics: ['Double entry', 'Statement interpretation'],
    paperTopics: ['Ledger and trial balance', 'Statement preparation'],
  },
  {
    id: 6,
    code: 'PHR220',
    title: 'Pharmacology Fundamentals',
    category: 'Pharmacy',
    school: 'School of Pharmacy',
    program: 'Pharmacy',
    description: 'Study drug actions, classifications, dosage concepts, and safe patient-centered pharmacology review.',
    level: 'Year 2',
    deliveryMode: 'Lab + Lecture',
    image: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping learners memorize pharmacology safely through grouped concepts and recall patterns.',
    topics: ['Pharmacokinetics', 'Pharmacodynamics', 'Drug classifications', 'Dosage concepts', 'Adverse effects'],
    objectives: ['Differentiate key drug actions', 'Revise mechanism and effect relationships', 'Prepare for safe clinical discussion'],
    aiPrompts: ['Explain pharmacokinetics', 'Give me notes on drug classification', 'Help me memorize adverse effects'],
    noteTopics: ['Pharmacokinetics summary', 'Pharmacodynamics essentials', 'Adverse effects revision'],
    pdfTitles: ['Drug classification handbook', 'Dosage revision summary'],
    podcastTopics: ['Memorizing pharmacology without overload', 'How to organize drug classes for exams'],
    videoTopics: ['ADME visual breakdown', 'Drug mechanism comparison'],
    mcqTopics: ['Drug classifications', 'Adverse effects'],
    paperTopics: ['Pharmacokinetics and dynamics', 'Classification and safety'],
  },
  {
    id: 7,
    code: 'NUR230',
    title: 'Medical-Surgical Nursing',
    category: 'Nursing',
    school: 'School of Pharmacy',
    program: 'Nursing',
    description: 'Develop patient-care planning, assessment, interventions, and clinical reasoning for adult care settings.',
    level: 'Year 3',
    deliveryMode: 'Clinical + Theory',
    image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Supporting nursing students with structured care-plan thinking and fast recall.',
    topics: ['Assessment', 'Care planning', 'Common adult conditions', 'Interventions', 'Documentation'],
    objectives: ['Build sound care plans', 'Recognize common intervention priorities', 'Connect theory to ward practice'],
    aiPrompts: ['Help me write a care plan', 'Explain nursing interventions', 'Give me revision tips for adult care'],
    noteTopics: ['Patient assessment flow', 'Care plan writing', 'Intervention priorities'],
    pdfTitles: ['Care plan template', 'Adult care revision handbook'],
    podcastTopics: ['Thinking like a nurse in exams', 'Making care plans easier to remember'],
    videoTopics: ['Assessment sequence visual guide', 'Documentation and intervention review'],
    mcqTopics: ['Patient priorities', 'Care planning'],
    paperTopics: ['Adult care scenarios', 'Assessment and documentation'],
  },
  {
    id: 8,
    code: 'ENG201',
    title: 'Academic Writing',
    category: 'Communication',
    school: 'School of Humanities and Social Sciences',
    program: 'Communication and Writing Studies',
    description: 'Strengthen argument flow, citations, paragraphing, editing, and research-based academic expression.',
    level: 'Year 2',
    deliveryMode: 'Workshop',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping learners who struggle to turn ideas into well-structured academic writing.',
    topics: ['Essay structure', 'Paragraph unity', 'Research use', 'Referencing', 'Editing'],
    objectives: ['Plan clearer essays', 'Use sources well', 'Improve academic confidence and presentation'],
    aiPrompts: ['Show me essay structure notes', 'Explain referencing simply', 'Help me improve my paragraph flow'],
    noteTopics: ['Essay structure essentials', 'Referencing basics', 'Editing checklist'],
    pdfTitles: ['Academic writing starter pack', 'Citation and referencing guide'],
    podcastTopics: ['Writing strong paragraphs', 'How to beat essay-writing stress'],
    videoTopics: ['Essay planning map', 'Editing and proofreading workflow'],
    mcqTopics: ['Referencing', 'Argument structure'],
    paperTopics: ['Essay planning and citation', 'Editing and structure'],
  },
  {
    id: 9,
    code: 'PSY210',
    title: 'Developmental Psychology',
    category: 'Psychology',
    school: 'School of Humanities and Social Sciences',
    program: 'Psychology',
    description: 'Explore human development across stages, major theories, and behavior patterns in social contexts.',
    level: 'Year 2',
    deliveryMode: 'Blended',
    image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Making theory-heavy psychology content easier to compare and remember.',
    topics: ['Childhood development', 'Adolescence', 'Adulthood', 'Major theorists', 'Social development'],
    objectives: ['Compare developmental theories', 'Explain stage-based changes', 'Link theory to behavior examples'],
    aiPrompts: ['Compare Piaget and Erikson', 'Give me notes on adolescence', 'Quiz me on developmental stages'],
    noteTopics: ['Piaget and Erikson comparison', 'Adolescence overview', 'Adult development summary'],
    pdfTitles: ['Developmental theory comparison chart', 'Stage-by-stage revision booklet'],
    podcastTopics: ['Remembering psychology theorists', 'How to compare development stages'],
    videoTopics: ['Theory comparison visual guide', 'Human development timeline'],
    mcqTopics: ['Developmental stages', 'Theory comparison'],
    paperTopics: ['Theorists and stages', 'Behavior and development'],
  },
  {
    id: 10,
    code: 'LAW110',
    title: 'Introduction to Constitutional Law',
    category: 'Law',
    school: 'School of Humanities and Social Sciences',
    program: 'Law',
    description: 'Study constitutional structure, rights, governance, and legal interpretation in civic contexts.',
    level: 'Year 1',
    deliveryMode: 'Lecture',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=900&q=80',
    supportFocus: 'Helping students read legal ideas in simpler language before deeper case discussion.',
    topics: ['Sources of law', 'Separation of powers', 'Bill of rights', 'Judicial review', 'Constitutional interpretation'],
    objectives: ['Understand core constitutional structure', 'Explain rights clearly', 'Prepare for case and essay questions'],
    aiPrompts: ['Explain separation of powers', 'Give me notes on bill of rights', 'Help me revise judicial review'],
    noteTopics: ['Separation of powers', 'Bill of rights overview', 'Judicial review essentials'],
    pdfTitles: ['Constitutional principles booklet', 'Rights revision guide'],
    podcastTopics: ['Understanding constitutional law simply', 'How to answer legal essay questions'],
    videoTopics: ['Government structure visual guide', 'Rights and interpretation overview'],
    mcqTopics: ['Rights and freedoms', 'Legal interpretation'],
    paperTopics: ['Constitutional principles', 'Rights and judicial review'],
  },
];

const catalogCourses: CatalogCourse[] = courseSeeds.map((seed) => ({
  ...seed,
  resources: createResources(seed),
}));

export function getAllCatalogCourses() {
  return catalogCourses;
}

export function getCatalogCourseById(id?: string | number | null) {
  return catalogCourses.find((course) => String(course.id) === String(id) || course.code.toLowerCase() === String(id || '').toLowerCase()) || null;
}

export function getCatalogCourseByCode(code?: string | null) {
  return catalogCourses.find((course) => course.code.toLowerCase() === String(code || '').toLowerCase()) || null;
}

export function getAllCatalogResources() {
  return catalogCourses.flatMap((course) => course.resources);
}

export function getResourcesForCourse(code?: string | null) {
  return getCatalogCourseByCode(code)?.resources || [];
}

export function getCatalogSchools() {
  return Array.from(
    catalogCourses.reduce((map, course) => {
      const current = map.get(course.school) || { name: course.school, programs: new Set<string>(), courseCount: 0 };
      current.programs.add(course.program);
      current.courseCount += 1;
      map.set(course.school, current);
      return map;
    }, new Map<string, { name: string; programs: Set<string>; courseCount: number }>()),
  ).map(([, value]) => ({
    name: value.name,
    programCount: value.programs.size,
    courseCount: value.courseCount,
  }));
}

export function getProgramsForSchool(school?: string | null) {
  const matchedCourses = school
    ? catalogCourses.filter((course) => course.school === school)
    : catalogCourses;

  return Array.from(
    matchedCourses.reduce((map, course) => {
      const current = map.get(course.program) || { name: course.program, school: course.school, courseCount: 0 };
      current.courseCount += 1;
      map.set(course.program, current);
      return map;
    }, new Map<string, { name: string; school: string; courseCount: number }>()),
  ).map(([, value]) => value);
}

export function getSupplementalEnrollmentCodes() {
  if (typeof localStorage === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(ENROLLMENT_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

export function saveSupplementalEnrollmentCode(code: string) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  const current = new Set(getSupplementalEnrollmentCodes());
  current.add(code);
  localStorage.setItem(ENROLLMENT_STORAGE_KEY, JSON.stringify(Array.from(current)));
}

export function buildMergedCourses(apiCourses: any[] = []) {
  const apiByCode = new Map(
    apiCourses
      .filter((course) => course?.code)
      .map((course) => [String(course.code).toLowerCase(), course]),
  );
  const supplementalEnrollments = new Set(getSupplementalEnrollmentCodes().map((code) => code.toLowerCase()));

  const mergedCatalogCourses = catalogCourses.map((catalogCourse) => {
    const apiCourse = apiByCode.get(catalogCourse.code.toLowerCase());
    return {
      id: apiCourse?.id ?? catalogCourse.code,
      code: catalogCourse.code,
      category: apiCourse?.category || catalogCourse.category,
      title: apiCourse?.title || catalogCourse.title,
      description: apiCourse?.description || catalogCourse.description,
      image: apiCourse?.image || catalogCourse.image,
      level: apiCourse?.level || catalogCourse.level,
      deliveryMode: apiCourse?.deliveryMode || catalogCourse.deliveryMode,
      enrolledCount: apiCourse?.enrolledCount ?? 0,
      relatedGroupCount: apiCourse?.relatedGroupCount ?? 0,
      upcomingSessionCount: apiCourse?.upcomingSessionCount ?? 0,
      isEnrolled: Boolean(apiCourse?.isEnrolled) || supplementalEnrollments.has(catalogCourse.code.toLowerCase()),
      school: catalogCourse.school,
      program: catalogCourse.program,
      supportFocus: catalogCourse.supportFocus,
      resourceCount: catalogCourse.resources.length,
      podcastCount: catalogCourse.resources.filter((resource) => resource.type === 'Podcast').length,
      pdfCount: catalogCourse.resources.filter((resource) => resource.type === 'PDF').length,
      noteCount: catalogCourse.resources.filter((resource) => resource.type === 'Note').length,
    };
  });

  const catalogCodes = new Set(mergedCatalogCourses.map((course) => course.code.toLowerCase()));
  const extraApiCourses = apiCourses
    .filter((course) => !catalogCodes.has(String(course.code || '').toLowerCase()))
    .map((course) => ({
      ...course,
      school: 'General',
      program: course.category || 'General Studies',
      supportFocus: 'Additional academic support within StudyLink.',
      resourceCount: 0,
      podcastCount: 0,
      pdfCount: 0,
      noteCount: 0,
    }));

  return [...mergedCatalogCourses, ...extraApiCourses].sort((left, right) => String(left.code).localeCompare(String(right.code)));
}

export function buildCourseContent(courseLike: { id?: string | number; code?: string; title?: string; category?: string; description?: string; image?: string; level?: string; deliveryMode?: string; enrolledCount?: number; isEnrolled?: boolean; students?: any[]; groups?: any[]; sessions?: any[] } | null) {
  const catalogCourse = getCatalogCourseByCode(courseLike?.code || '') || getCatalogCourseById(courseLike?.id);

  if (!catalogCourse && !courseLike) {
    return null;
  }

  const baseCode = courseLike?.code || catalogCourse?.code || 'COURSE';

  return {
    id: courseLike?.id ?? catalogCourse?.id ?? 0,
    code: baseCode,
    category: courseLike?.category || catalogCourse?.category || 'General',
    school: catalogCourse?.school || 'General',
    program: catalogCourse?.program || courseLike?.category || 'General Studies',
    title: courseLike?.title || catalogCourse?.title || 'Course Support Hub',
    description: courseLike?.description || catalogCourse?.description || 'A study support hub with notes, PDFs, podcasts, and revision guidance.',
    image: courseLike?.image || catalogCourse?.image || '',
    level: courseLike?.level || catalogCourse?.level || 'Year 1',
    deliveryMode: courseLike?.deliveryMode || catalogCourse?.deliveryMode || 'Blended',
    enrolledCount: courseLike?.enrolledCount ?? 0,
    isEnrolled: Boolean(courseLike?.isEnrolled) || getSupplementalEnrollmentCodes().map((item) => item.toLowerCase()).includes(baseCode.toLowerCase()),
    students: courseLike?.students || [],
    groups: courseLike?.groups || [],
    sessions: courseLike?.sessions || [],
    supportFocus: catalogCourse?.supportFocus || 'Peer-based academic support.',
    topics: catalogCourse?.topics || [],
    objectives: catalogCourse?.objectives || [],
    aiPrompts: catalogCourse?.aiPrompts || [],
    resources: catalogCourse?.resources || [],
  };
}

export function buildStudyLinkAiResponse(question: string, selectedCourseCode?: string | null): StudyLinkAiResponse {
  const normalizedQuestion = String(question || '').trim().toLowerCase();
  const selectedCourse = getCatalogCourseByCode(selectedCourseCode || '');
  const fallbackCourse = selectedCourse || catalogCourses.find((course) =>
    normalizedQuestion.includes(course.code.toLowerCase()) || normalizedQuestion.includes(course.title.toLowerCase()),
  ) || catalogCourses[0];

  const matchedTopics = fallbackCourse.topics.filter((topic) =>
    normalizedQuestion.split(/\W+/).some((part) => part && topic.toLowerCase().includes(part)),
  );
  const focusTopic = matchedTopics[0] || fallbackCourse.topics[0];
  const recommendedResources = fallbackCourse.resources.filter((resource) =>
    resource.title.toLowerCase().includes(focusTopic.toLowerCase().split(' ')[0]),
  ).slice(0, 4);

  const noteFallback = fallbackCourse.resources.filter((resource) => resource.type === 'Note').slice(0, 2);
  const finalResources = recommendedResources.length > 0 ? recommendedResources : noteFallback;

  const externalLinks = [
    { label: 'Search PDFs', url: buildPdfSearchUrl(`${fallbackCourse.title} ${focusTopic}`) },
    { label: 'Search YouTube', url: buildYoutubeSearchUrl(`${fallbackCourse.title} ${focusTopic}`) },
    { label: 'Search Scholar', url: buildScholarSearchUrl(`${fallbackCourse.title} ${focusTopic}`) },
    { label: 'Search MCQs', url: buildMcqSearchUrl(`${fallbackCourse.title} ${focusTopic}`) },
  ];

  return {
    headline: `${fallbackCourse.code}: ${focusTopic}`,
    explanation: `StudyLink AI recommends starting with ${focusTopic.toLowerCase()} in ${fallbackCourse.title}. Begin by understanding the concept clearly, then link it to the course outcomes, practical examples, and likely exam questions. Use the steps below to build depth, retain the idea, and apply it to real study tasks.`,
    nextSteps: [
      `Define ${focusTopic.toLowerCase()} in your own words and note how it appears in ${fallbackCourse.title}.`,
      `Compare the concept with one related topic from the course so you can see the difference clearly.`,
      `Open one note or PDF and outline the main stages, formulas, or definitions it uses.`,
      `Watch a video or listen to a podcast to reinforce the idea through another learning mode.`,
      `Try one practice question or MCQ on the topic, then explain the answer aloud.`,
      'After each pass, write a short summary to lock the learning and identify any weak points to revisit.',
    ],
    focusAreas: [
      `Core definition and why ${focusTopic.toLowerCase()} matters in ${fallbackCourse.title}.`, 
      `Common mistakes or misconceptions students make with this topic.`, 
      `How the topic is used in assignments, exams, or practical tasks.`, 
      `A short example or scenario that makes the idea concrete.`, 
    ],
    studyTips: [
      'Break the topic into small parts and study one part at a time.',
      'Write a simple explanation as if you were teaching a friend.',
      'Use notes, video, and practice together to build deeper understanding.',
      'Review the same idea again after a short break to strengthen recall.',
    ],
    recommendedResources: finalResources,
    peerAdvice: `If this course feels difficult, do not study it alone. Use the notes first, then take the same topic into your StudyLink group discussion for faster understanding.`,
    externalLinks,
  };
}
