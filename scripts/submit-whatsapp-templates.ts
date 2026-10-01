import fs from "fs";

// Load .env manually if not already populated
if (fs.existsSync(".env")) {
  const envContent = fs.readFileSync(".env", "utf8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const token = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
const defaultWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
const targetWabaId = process.argv[2] || defaultWabaId;

const templates = [
  {
    name: "interview_confirmed_briefing",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "Interview Confirmed",
      },
      {
        type: "BODY",
        text: "Hi {{1}},\n\nYour interview with {{2}} for the {{3}} position has been confirmed!\n\n📅 Date & Time: {{4}}\n⏱️ Duration: {{5}} Minutes\n📌 Round: {{6}}\n💻 Meeting Link: {{7}}\n\nKey Tips:\n• Join 5 minutes early in a quiet setting with your camera enabled.\n• Structure technical answers around situation, approach, and trade-offs.\n\nBest of luck!",
        example: {
          body_text: [
            [
              "Saurabh Prajapati",
              "Acme Corp",
              "Senior Backend Engineer",
              "Tomorrow, 3:00 PM",
              "45",
              "Technical Round 1",
              "https://meet.google.com/xyz-abc",
            ],
          ],
        },
      },
      {
        type: "FOOTER",
        text: "Talent Advisory • Reply if you need assistance",
      },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Confirm Attendance 👍" },
          { type: "QUICK_REPLY", text: "Need Assistance ❓" },
        ],
      },
    ],
  },
  {
    name: "notice_period_pulse",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "Notice Period Check-in",
      },
      {
        type: "BODY",
        text: "Hi {{1}},\n\nHope you are having a productive week! Just checking in on how your notice period is progressing ahead of your joining date at {{2}} as {{3}}.\n\nPlease let us know if your transition is on track or if you need any support from our team regarding documentation.",
        example: {
          body_text: [["Saurabh Prajapati", "Acme Corp", "Senior Backend Engineer"]],
        },
      },
      {
        type: "FOOTER",
        text: "Talent Advisory",
      },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "On Track 👍" },
          { type: "QUICK_REPLY", text: "Need Assistance ❓" },
        ],
      },
    ],
  },
  {
    name: "candidate_sourcing_outreach",
    category: "UTILITY",
    language: "en_US",
    components: [
      {
        type: "HEADER",
        format: "TEXT",
        text: "Career Opportunity",
      },
      {
        type: "BODY",
        text: "Hi {{1}},\n\nWe reviewed your profile and believe your background is a strong match for an open {{2}} opportunity with {{3}}.\n\nWould you be open to exploring this role? Reply directly to this message to see the full compensation details and job description.",
        example: {
          body_text: [["Saurabh Prajapati", "Senior Backend Engineer", "Acme Corp"]],
        },
      },
      {
        type: "FOOTER",
        text: "Talent Advisory",
      },
      {
        type: "BUTTONS",
        buttons: [
          { type: "QUICK_REPLY", text: "Interested 👍" },
          { type: "QUICK_REPLY", text: "Not Right Now ✋" },
        ],
      },
    ],
  },
];

async function submitAll() {
  console.log(`🚀 Starting programmatic submission to WABA: ${targetWabaId}...`);
  if (!token) {
    console.error("❌ Missing WHATSAPP_API_TOKEN in environment.");
    process.exit(1);
  }

  for (const tpl of templates) {
    console.log(`\n📤 Submitting '${tpl.name}' (${tpl.language})...`);
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${targetWabaId}/message_templates`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tpl),
      });

      const data = await res.json();
      if (res.ok) {
        console.log(`✅ SUCCESS: '${tpl.name}' submitted! ID: ${data.id}, Status: ${data.status}`);
      } else {
        console.error(`❌ FAILED: '${tpl.name}':`, JSON.stringify(data.error || data, null, 2));
      }
    } catch (err) {
      console.error(`❌ NETWORK ERROR: '${tpl.name}':`, err);
    }
  }
}

submitAll();
