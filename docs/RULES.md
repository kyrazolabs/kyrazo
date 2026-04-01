# Kyrazo Documentation Rules & Style Guide

To maintain "GOAT" status for our documentation, all contributors must follow these rules. High-quality documentation is a core feature of the Kyrazo platform.

## 1. Tone & Voice
- **Professional but Approachable**: Use clear, concise language. Avoid jargon where a simpler term suffices, but don't shy away from necessary technical accuracy.
- **Empower the User**: Focus on "how-to" and "why." The goal is to get the user from idea to production as fast as possible.
- **Inclusive**: Use gender-neutral language (they/them) and avoid ableist metaphors.

## 2. Structural Requirements
- **Title & Description**: Every page must have a clear `title` and a `description` in the frontmatter.
- **Prerequisites**: If a guide requires an API key, a specific SDK version, or a target configuration, list it at the top using a `<Note>` or `<Warning>` component.
- **Next Steps**: Always end a guide by suggesting the most logical next step using `<CardGroup>` or a simple list.

## 3. Component Standards (Mintlify)
- **Callouts**: Use `<Note>` for helpful tips, `<Warning>` for potential pitfalls, and `<Check>` for verification steps.
- **Code Blocks**:
    - **Always used named tabs**: Don't just provide a code block; use `<Tabs>` and name them (e.g., `Node.js (Express)`, `Python (Flask)`).
    - **No Placeholders**: Avoid `{placeholder}` style. Use descriptive placeholders like `"{YOUR_API_KEY}"` or `"{NAMESPACE_ID}"` so users know exactly what to replace.
    - **Real-world Examples**: Code snippets should be production-ready and follow the best practices of each language.

## 4. Visual Excellence
- **Mermaid Diagrams**: Use them to explain complex flows (e.g., event dispatching, signature verification).
- **Icons**: Use FontAwesome icons consistently in `<Card>` and `<Tab>` components.
- **Spacing**: Keep paragraphs short (maximum 3-4 sentences). Use bullet points for lists.

## 5. Multi-Language Priority
Kyrazo is language-agnostic. Every core conceptual guide or verification example must provide snippets for at least:
1. **JavaScript/TypeScript** (Official SDK)
2. **Python** (Official SDK)
3. **cURL** (Mental model for the API)
4. **Go/Ruby/Java** (As relevant for the context)

## 6. The "Quickstart Test"
A user should be able to follow the "Quickstart" or any "Get Started" guide and have a working end-to-end integration in **under 5 minutes**. If it takes longer or requires more than 5 steps, the guide should be broken down into smaller parts.

---

*Remember: We aren't just writing documentation; we are building trust with our developers. Make it the best part of their integration.*
