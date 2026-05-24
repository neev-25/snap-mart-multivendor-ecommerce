import { NextRequest, NextResponse } from "next/server";

const geminiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent"


export async function POST(req:NextRequest) {
    try {
        const {message,role,targetRole}=await req.json()
        if(!message || !role || !targetRole)
        {
            return NextResponse.json({suggestions:[]});
        }
        const roleMatrix: Record<string, string> = {
      "user_vendor": `
    You are replying as a USER to a VENDOR.

    GOAL:
    Request help or clarification.

    RULES:
    - Clearly explain the issue or request
    - Be polite and respectful
    - Do not sound demanding or accusatory
    - Do not propose solutions yourself
    - Ask only what is necessary
    `,

      "vendor_user": `
    You are replying as a VENDOR to a USER.

    GOAL:
    Assist the user professionally.

    RULES:
    - Be solution-oriented
    - Acknowledge the user's concern
    - Avoid blaming the user
    - Do not overpromise timelines or refunds
    - Ask for details only if required
    `,

      "vendor_admin": `
    You are replying as a VENDOR to an ADMIN.

    GOAL:
    Escalate or clarify an issue.

    RULES:
    - Be factual and concise
    - Clearly state the problem
    - Include relevant technical or operational context
    - Ask for guidance or approval if needed
    - Avoid emotional language
    `,

      "admin_vendor": `
    You are replying as an ADMIN to a VENDOR.

    GOAL:
    Resolve or guide.

    RULES:
    - Be authoritative but fair
    - Request missing information if needed
    - Provide clear next steps when possible
    - Avoid unnecessary explanations
    `,
    };
    const roleKey=`${role}_${targetRole}`;
    const roleContext=roleMatrix[roleKey]||"";
    const prompt = `
    You are an AI assistant specialized in short, professional support replies.

    ROLE & CONTEXT:
    ${roleContext}

    CONVERSATION CONTEXT:
    The last message you received is:
    "${message}"

    OBJECTIVE:
    Generate exactly THREE reply suggestions that are suitable for sending directly to the other party.

    STRICT OUTPUT RULES:
    - Each reply must be between 5 words or short
    - Polite, professional, and neutral tone
    - Clear and context-aware
    - No emojis
    - No explanations
    - No greetings like "Hi" or "Hello"
    - No signatures
    - No repetition across suggestions
    - One reply per line
    - No numbering, bullets, or symbols

    QUALITY RULES:
    - Replies must logically respond to the message
    - Do NOT invent facts, promises, or timelines
    - If information is missing, politely request clarification
    - Avoid generic phrases like "Let me know" unless appropriate
    - Sound human, not robotic

    OUTPUT FORMAT:
    Plain text only.
    Exactly three lines.
    `;

    const geminiResponse=await fetch(
        `${geminiUrl}?key=${process.env.GEMINI_API_KEY}`,
        {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({
                contents:[
                    {
                        parts:[{text:prompt}]
                    },
                ],
            }),
        }
    );
    const data=await geminiResponse.json()
    const text=data?.candidates?.[0]?.content?.parts?.[0]?.text||"";
    const suggestions=text.split("\n").map((s:string)=>s.trim()).filter(Boolean).slice(0,3);
    return NextResponse.json({suggestions});

        } catch (error) {
            console.error("Suggestion error:",error);
            return NextResponse.json({suggestions:[]});
        }    

}