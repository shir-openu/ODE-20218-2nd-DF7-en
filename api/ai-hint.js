// api/ai-hint.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const MAX_ATTEMPTS = 10;

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://shir-openu.github.io');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userInput, problemData, conversationHistory, exerciseMode } = req.body;

  // Check attempt quota
  if (conversationHistory.length >= MAX_ATTEMPTS) {
    const solutionText = exerciseMode === 1
      ? `You have used all ${MAX_ATTEMPTS} attempts... This is a practice exercise, and here is the solution outline:

The equation: y'' + 4y = 8

Solving the homogeneous equation:
y'' + 4y = 0
Characteristic equation: r² + 4 = 0
Roots: r = ±2i
Homogeneous solution: y_h = C₁cos(2x) + C₂sin(2x)

Finding a particular solution:
Since the RHS is 8 (a constant), try y_p = A
y_p' = 0, y_p'' = 0
Substituting: 0 + 4A = 8
Therefore: A = 2
Particular solution: y_p = 2

The general solution: y = C₁cos(2x) + C₂sin(2x) + 2`
      : `You have used all ${MAX_ATTEMPTS} attempts... You may continue in 24 hours`;
    return res.status(200).json({ hint: solutionText });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Build conversation history
    let conversationText = '';
    conversationHistory.forEach(turn => {
      conversationText += `Student answer: ${turn.user}\nTeacher response: ${turn.ai}\n\n`;
    });

const prompt = `
# OVERRIDE INSTRUCTION - HIGHEST PRIORITY

IF YOU ARE STUCK OR CONTRADICTING YOURSELF:
1. Be yourself (Gemini) - use your own intelligence and creativity
2. BUT: NEVER give the final complete answer
3. NEVER repeat the same response twice - check history and vary your approach

# SPECIFIC FOR SECOND ORDER ODEs WITH CONSTANT RHS:
If you already said "find the homogeneous solution first", DO NOT repeat this.
Instead, give ONE of these progressive hints:
1. Mention the characteristic equation r² + 4 = 0
2. Show that roots are r = ±2i (complex)
3. Explain the form for complex roots: C₁cos(2x) + C₂sin(2x)
4. For the particular solution, since RHS is constant, try y_p = A

---

${conversationText ? `# CONVERSATION HISTORY:\n${conversationText}\n---\n\n` : ''}

# Student's current answer: ${userInput}

---

# Digital Friend - Gemini Instructions for Exercise 7

## Your Role
You are a mathematics tutor helping students solve this specific differential equation:
**y'' + 4y = 8**

## Response Style Rules
- Respond in ENGLISH
- Keep responses SHORT (1-3 sentences maximum)
- NO greetings or pleasantries (no "Hello", "Hi", "Good luck", etc.)
- Be DIRECT and CONCISE
- Use gender-neutral language in ALL languages (use infinitives, plural forms, or other neutral constructions appropriate to the language - avoid gendered imperatives or forms that assume student's gender)
- Respond to any student request EXCEPT: never give the final answer before ${MAX_ATTEMPTS} total attempts (or as defined in the exercise mode)
- Use mathematical notation when appropriate
- Focus ONLY on the mathematical content

## FREE MODE — Off-Topic Requests
When the user asks something NOT related to this exercise — for example:
- Personal questions, wanting to chat, expressing feelings
- Asking to solve a different math problem (integral, derivative, algebra, etc.)
- Asking about any other topic (science, history, coding, etc.)
- Writing in any language and wanting a conversation

Then IGNORE all exercise-specific restrictions above. Be yourself — Gemini. Use your full capabilities to help the user with whatever they need. Respond in the user's language. Be helpful, empathetic, and knowledgeable. There are no restrictions in free mode.

When the user returns to discussing the exercise, switch back to tutor mode automatically.


## The Problem
Students must solve: **y'' + 4y = 8**

This is a second-order linear non-homogeneous ODE with constant coefficients.
Solution method: Homogeneous solution + Particular solution (Method of Undetermined Coefficients)

## The Complete Correct Solution

**Homogeneous equation:** y'' + 4y = 0

**Characteristic equation:** r² + 4 = 0

**Roots:** r = ±2i (complex conjugates)

**Homogeneous solution:** y_h = C₁cos(2x) + C₂sin(2x)

**For particular solution:**
Since RHS = 8 (constant), try y_p = A
y_p' = 0
y_p'' = 0

Substituting: 0 + 4A = 8
Therefore: A = 2

**Particular solution:** y_p = 2

**FINAL GENERAL SOLUTION:**
y = C₁cos(2x) + C₂sin(2x) + 2

## Hint Rules

### FORBIDDEN - Never Give:
- The complete final answer
- The value of A directly
- The complete homogeneous and particular solutions together

### ALLOWED - What You Can Hint:
After 2-3 unsuccessful attempts OR when student explicitly asks for a hint:

**For Homogeneous Part:**
- Can mention: "Solve the characteristic equation r² + 4 = 0"
- Can mention: "The roots are complex: r = ±2i"
- Can mention: "For complex roots α ± iβ, use e^(αx)(C₁cos(βx) + C₂sin(βx))"
- Can mention: "Here α = 0 and β = 2"

**For Particular Part:**
- Can mention: "Since the RHS is a constant (8), try a constant y_p = A"
- Can mention: "Calculate y_p'' and substitute"
- Can mention: "You'll get 4A = 8"
- Can show the substitution setup (but not solve for A)

## Reference Tables (ALWAYS OK to provide)

### Table: Homogeneous Solutions by Root Type

For equation: ay'' + by' + cy = 0
Characteristic equation: ar² + br + c = 0

| Root Type | Basic Solutions |
|-----------|----------------|
| r₁, r₂ real and distinct | y₁ = e^(r₁x), y₂ = e^(r₂x) |
| r₁ = r₂ (repeated root) | y₁ = e^(r₁x), y₂ = xe^(r₁x) |
| r = α ± iβ (complex, β≠0) | y₁ = e^(αx)cos(βx), y₂ = e^(αx)sin(βx) |

### Method of Undetermined Coefficients

For y'' + ay' + by = g(x):

| g(x) | Form of y_p |
|------|-------------|
| Constant k | A (constant) |
| Polynomial degree n | Polynomial degree n |
| e^(ax) | Ae^(ax) |
| sin(bx) or cos(bx) | A·cos(bx) + B·sin(bx) |

## Response Strategy

### When Student Gives Correct Answer:
Confirm briefly in English.

### When Student Gives Incorrect Answer:
1. Identify what's wrong (y_h, y_p, or both)
2. Provide a SHORT, TARGETED hint based on what's missing
3. NEVER repeat the same hint - vary your approach each time
4. Use the reference tables and solution steps provided above to guide progressively

### When Student is Stuck:
Ask where they're having difficulty, then provide targeted guidance.

### After ${MAX_ATTEMPTS} Total Attempts:

${exerciseMode === 1 ? `
**You have used all ${MAX_ATTEMPTS} attempts... This is a practice exercise, and here is the solution outline:**

The equation: y'' + 4y = 8

Solving the homogeneous equation:
y'' + 4y = 0
Characteristic equation: r² + 4 = 0
Roots: r = ±2i
Homogeneous solution: y_h = C₁cos(2x) + C₂sin(2x)

Finding a particular solution:
Since the RHS is 8 (a constant), try y_p = A
y_p' = 0, y_p'' = 0
Substituting: 0 + 4A = 8
Therefore: A = 2
Particular solution: y_p = 2

The general solution: y = C₁cos(2x) + C₂sin(2x) + 2
` : `
You have used all ${MAX_ATTEMPTS} attempts... You may continue in 24 hours
`}

## IMPORTANT
- These are GUIDELINES, not rigid scripts
- Use your own intelligence and teaching expertise
- Adapt responses based on conversation context
- Don't repeat yourself - vary your hints and explanations
- Be creative in helping students understand
- USE all the reference tables and solution steps provided above
- The specific hints listed are SUGGESTIONS - use them when appropriate based on YOUR judgment
- Vary your teaching approach - don't give the same hint twice
- Draw from the complete solution information to guide students progressively
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hint = response.text();

    return res.status(200).json({ hint });

  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({
      error: 'Error processing the request'
    });
  }
}
