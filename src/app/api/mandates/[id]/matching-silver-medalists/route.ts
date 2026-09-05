import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET /api/mandates/[id]/matching-silver-medalists - Find pre-vetted silver medalists matching mandate (RC-07)
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user.agencyId) {
      return NextResponse.json({ error: "Unauthorized: Missing tenant session." }, { status: 401 });
    }

    const mandateId = params.id;

    // 1. Fetch target mandate
    const mandate = await prisma.jobMandate.findFirst({
      where: {
        id: mandateId,
        agencyId: session.user.agencyId,
      },
    });

    if (!mandate) {
      return NextResponse.json({ error: "Mandate not found." }, { status: 404 });
    }

    const mandateSkills = (mandate.skills || []).map((s) => s.toLowerCase().trim());

    // 2. Fetch all Silver Medalist candidates for this agency
    const silverMedalists = await prisma.candidate.findMany({
      where: {
        agencyId: session.user.agencyId,
        isSilverMedalist: true,
      },
      include: {
        submissions: {
          where: { mandateId },
        },
      },
    });

    // 3. Score matching skills & filter
    const matches = silverMedalists.map((c) => {
      const candidateSkills = (c.skills || []).map((s) => s.toLowerCase().trim());
      const overlappingSkills = candidateSkills.filter((s) =>
        mandateSkills.some((ms) => ms.includes(s) || s.includes(ms))
      );

      let matchPercentage = 0;
      if (mandateSkills.length > 0) {
        matchPercentage = Math.min(100, Math.round((overlappingSkills.length / mandateSkills.length) * 100));
      } else {
        matchPercentage = 75; // Default generic match score
      }

      const isAlreadySubmitted = c.submissions.length > 0;
      const currentStage = isAlreadySubmitted ? c.submissions[0].stage : null;

      return {
        id: c.id,
        fullName: c.fullName,
        currentTitle: c.currentTitle,
        currentCompany: c.currentCompany,
        totalExpYears: c.totalExpYears,
        expectedCtc: c.expectedCtc,
        currency: c.currency,
        noticePeriodDays: c.noticePeriodDays,
        skills: c.skills,
        matchingSkills: overlappingSkills,
        matchPercentage,
        silverMedalistReason: c.silverMedalistReason,
        isAlreadySubmitted,
        currentStage,
      };
    });

    // Sort by match percentage descending
    matches.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return NextResponse.json({ matchingCandidates: matches });
  } catch (error: any) {
    console.error("Error matching silver medalists:", error);
    return NextResponse.json({ error: error.message || "Failed to find matching silver medalists" }, { status: 500 });
  }
}

