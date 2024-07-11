interface Question {
    id: string;
    condition: Function
}

let questions: Question[] = [
    { id: 'AGI', condition: (input: any) => { return santize(input) === "artificialgeneralintelligence" ? -3 : 4 } },
    { id: 'CatQuestion', condition: (input: any) => { return Boolean(input) === false ? -2 : 1 } },
    { id: 'ShortFormContent', condition: (input: any) => { return -1 * parseInt(input) } },
    { id: 'Chemistry', condition: (input: any) => { return santize(input as string) === "francium" ? 10 : -5 } },
    { id: 'GPT', condition: (input: any) => { return santize(input) === "generativepretrainedtransformer" ? 5 : -3 } },
    { id: 'MathQuestion', condition: (input: any) => { return parseInt(input) === 30 ? 8 : -20 } },
    { id: 'ContentCreators', condition: (input: any) => { return -1 * parseInt(input) * 1.5 } },
    { id: 'MathProblem', condition: (input: any) => { return parseInt(input) === 9 ? 15 : -10 } },
    { id: 'SequenceSymbol', condition: (input: any) => { return input === 3 ? 10 : -7 } },
    { id: 'SequenceNumber', condition: (input: any) => { return parseInt(input) === 42 ? 9 : -3 } },
    { id: 'Dexerto', condition: (input: any) => { return Boolean(input) == true ? -25 : 25 } },
    { id: 'MathProblemComplex', condition: (input: any) => { return input === '7-14-4' ? 25 : 0 } },
    { id: 'TypingTest', condition: (input: any) => { return Math.round(parseInt(input) / 0.25) } },
    { id: 'AudioRick', condition: (input: any) => { return Boolean(input) ? -13 : 5 } },
    { id: 'Degree', condition: (input: any) => { return Boolean(input) ? -5 : 0 } },
    { id: 'AudioAgeOfWar', condition: (input: any) => { return Boolean(input) ? 15 : -5 } },
    { id: 'British', condition: (_: any) => { return 0; } },
    { id: 'Kubernete', condition: (input: any) => { return Boolean(input) ? -3 : 0 } },
    { id: 'ReactionImage', condition: (input: any) => { return Boolean(input) ? -10 : 5 } },
    { id: 'GimmickAccount', condition: (input: any) => { return Boolean(input) ? -5 : 5 } }
];

import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    let totalIQ = 80; // Start with default 80 IQ
    let formattedText = "";

    for (const question of questions) {
        if (body[question.id] !== undefined) {
            const iqChange = question.condition(body[question.id]);
            totalIQ += iqChange;
            formattedText += `${question.id} = ${iqChange > 0 ? '+' : ''}${iqChange} IQ\n`;
        }
    }

    return json({ 
        totalIQ: totalIQ,
        formattedText: formattedText.trim()
    });
}

function santize(input: string) {
    return input.toLowerCase().replace(/\s/g, '');
}