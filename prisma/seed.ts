import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashSync } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString || typeof connectionString !== "string" || !connectionString.trim()) {
  throw new Error(
    "DATABASE_URL is missing or empty. Add it to .env (e.g. DATABASE_URL=\"postgresql://USER:PASSWORD@HOST:PORT/DATABASE\"). Password must be in the URL."
  );
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // 1. Create Tenant
  const tenant = await prisma.tenant.create({
    data: { name: "TechCorp Solutions" },
  });
  console.log("Created tenant:", tenant.name);

  // 2. Create Super Admin (no tenant)
  const superAdmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "admin@hireflow.app",
      passwordHash: hashSync("admin123", 10),
      role: "SUPER_ADMIN",
    },
  });
  console.log("Created super admin:", superAdmin.email);

  // 3. Create HR Admin
  const hrAdmin = await prisma.user.create({
    data: {
      name: "Priya Sharma",
      email: "hr@techcorp.com",
      passwordHash: hashSync("hr123", 10),
      role: "HR_ADMIN",
      tenantId: tenant.id,
    },
  });
  console.log("Created HR admin:", hrAdmin.email);

  // 4. Create Team Members
  const devLead = await prisma.user.create({
    data: {
      name: "Rahul Kumar",
      email: "rahul@techcorp.com",
      passwordHash: hashSync("team123", 10),
      role: "TEAM_MEMBER",
      tenantId: tenant.id,
    },
  });

  const designLead = await prisma.user.create({
    data: {
      name: "Anita Desai",
      email: "anita@techcorp.com",
      passwordHash: hashSync("team123", 10),
      role: "TEAM_MEMBER",
      tenantId: tenant.id,
    },
  });
  console.log("Created team members:", devLead.name, ",", designLead.name);

  // 5. Create Jobs
  const job1 = await prisma.job.create({
    data: {
      title: "Senior Frontend Developer",
      description: `We are looking for an experienced Frontend Developer to join our team.

Requirements:
- 4+ years of experience with React/Next.js
- Strong TypeScript skills
- Experience with Tailwind CSS
- Understanding of REST APIs and state management
- Experience with testing frameworks (Jest, Cypress)

Responsibilities:
- Build and maintain responsive web applications
- Collaborate with design and backend teams
- Write clean, maintainable, well-tested code
- Participate in code reviews and technical discussions

Nice to have:
- Experience with GraphQL
- Familiarity with CI/CD pipelines
- Open source contributions`,
      department: "Engineering",
      budget: "₹12-18 LPA",
      targetTimeline: new Date("2026-04-15"),
      shareableSlug: "senior-frontend-developer-abc123",
      status: "PUBLISHED",
      tenantId: tenant.id,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: "Product Designer",
      description: `Join our design team to create beautiful, user-centric products.

Requirements:
- 3+ years of product design experience
- Proficiency in Figma
- Strong portfolio showcasing mobile and web design
- Understanding of design systems

Responsibilities:
- Design user interfaces for web and mobile platforms
- Conduct user research and usability testing
- Create and maintain design system components
- Work closely with engineering and product teams`,
      department: "Design",
      budget: "₹10-14 LPA",
      targetTimeline: new Date("2026-04-30"),
      shareableSlug: "product-designer-xyz789",
      status: "PUBLISHED",
      tenantId: tenant.id,
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: "Marketing Manager",
      description: `Lead our marketing efforts and drive brand growth.

Requirements:
- 5+ years in digital marketing
- Experience with SEO, SEM, and social media marketing
- Data-driven approach with analytics expertise
- Excellent communication skills`,
      department: "Marketing",
      budget: "₹8-12 LPA",
      shareableSlug: "marketing-manager-def456",
      status: "DRAFT",
      tenantId: tenant.id,
    },
  });
  console.log("Created jobs:", job1.title, ",", job2.title, ",", job3.title);

  // 6. Create Candidate Users and Applications
  const candidates = [
    { name: "Amit Patel", email: "amit@gmail.com" },
    { name: "Sara Khan", email: "sara@gmail.com" },
    { name: "Vikram Singh", email: "vikram@gmail.com" },
    { name: "Neha Gupta", email: "neha@gmail.com" },
    { name: "Arjun Mehta", email: "arjun@gmail.com" },
  ];

  for (const c of candidates) {
    const user = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        role: "CANDIDATE",
        passwordHash: hashSync("candidate123", 10),
      },
    });

    // Apply to job1
    const app = await prisma.application.create({
      data: {
        jobId: job1.id,
        candidateId: user.id,
        currentStatus:
          c.name === "Amit Patel"
            ? "R1_PENDING"
            : c.name === "Sara Khan"
              ? "R2_PENDING"
              : c.name === "Vikram Singh"
                ? "WAITLIST"
                : c.name === "Neha Gupta"
                  ? "REJECTED"
                  : "PENDING_AI",
        aiScore:
          c.name === "Amit Patel"
            ? 5
            : c.name === "Sara Khan"
              ? 4
              : c.name === "Vikram Singh"
                ? 3
                : c.name === "Neha Gupta"
                  ? 2
                  : null,
        aiSummary:
          c.name !== "Arjun Mehta"
            ? JSON.stringify({
                summary: `${c.name} shows strong technical skills relevant to the role. Their experience aligns well with the job requirements.`,
                keySkills: [
                  "React",
                  "TypeScript",
                  "Next.js",
                  "Tailwind CSS",
                ],
                matchReasons: [
                  "Strong frontend experience",
                  "Relevant tech stack",
                ],
                concerns: ["Could benefit from more leadership experience"],
              })
            : null,
      },
    });

    // Create status history
    await prisma.statusHistory.create({
      data: {
        applicationId: app.id,
        newStatus: "PENDING_AI",
        changedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      },
    });

    if (app.currentStatus !== "PENDING_AI") {
      await prisma.statusHistory.create({
        data: {
          applicationId: app.id,
          oldStatus: "PENDING_AI",
          newStatus: app.currentStatus,
          changedAt: new Date(
            Date.now() -
              (c.name === "Sara Khan" ? 8 : c.name === "Amit Patel" ? 7 : 9) *
                24 *
                60 *
                60 *
                1000
          ),
        },
      });
    }

    console.log(
      `  Created candidate ${c.name} → ${app.currentStatus}`
    );
  }

  // 7. Create an interview for Sara (she's in R2)
  const saraApp = await prisma.application.findFirst({
    where: { candidate: { email: "sara@gmail.com" } },
  });

  if (saraApp) {
    await prisma.interview.create({
      data: {
        applicationId: saraApp.id,
        interviewerId: devLead.id,
        roundName: "R1 Tech",
        scheduledAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        passed: true,
        feedback:
          "Excellent problem-solving skills. Strong React knowledge. Recommended for next round.",
      },
    });
  }

  // 8. Create a pending interview for Amit (he's in R1)
  const amitApp = await prisma.application.findFirst({
    where: { candidate: { email: "amit@gmail.com" } },
  });

  if (amitApp) {
    await prisma.interview.create({
      data: {
        applicationId: amitApp.id,
        interviewerId: devLead.id,
        roundName: "R1 Tech",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      },
    });
  }

  // 9. Also add Sara to job2
  const saraUser = await prisma.user.findUnique({
    where: { email: "sara@gmail.com" },
  });
  if (saraUser) {
    const app2 = await prisma.application.create({
      data: {
        jobId: job2.id,
        candidateId: saraUser.id,
        currentStatus: "R1_PENDING",
        aiScore: 4,
        aiSummary: JSON.stringify({
          summary:
            "Sara has a solid design background with frontend skills that bridge engineering and design.",
          keySkills: ["Figma", "UI/UX", "React", "Design Systems"],
          matchReasons: ["Cross-functional skills", "Strong portfolio"],
          concerns: [],
        }),
      },
    });
    await prisma.statusHistory.create({
      data: {
        applicationId: app2.id,
        newStatus: "R1_PENDING",
      },
    });
  }

  console.log("\nSeed complete! Login credentials:");
  console.log("─────────────────────────────────");
  console.log("Super Admin:  admin@hireflow.app / admin123");
  console.log("HR Admin:     hr@techcorp.com / hr123");
  console.log("Team Member:  rahul@techcorp.com / team123");
  console.log("Team Member:  anita@techcorp.com / team123");
  console.log("Candidate:    amit@gmail.com / candidate123");
  console.log("Candidate:    sara@gmail.com / candidate123");
  console.log("─────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
