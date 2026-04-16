interface UpgradeFlavor {
  name: string;
  description: string;
  icon: string;
}

/** Icons for milestone tiers 14-21 (shared across all buildings) */
export const MILESTONE_ICONS = ["🧩", "🛠️", "🏢", "🌍", "🤖", "🛡️", "📈", "🌠"] as const;

/**
 * Flavor text for standard building upgrades (tiers 1-13).
 * Tiers 14-21 use generated names/descriptions with MILESTONE_ICONS.
 * Each array must have exactly 13 entries (index 0 = tier 1).
 */
export const UPGRADE_FLAVOR: Record<string, UpgradeFlavor[]> = {
  intern: [
    { name: "Onboarding Docs", description: "They know where the repo is. 2x Intern production.", icon: "📄" },
    { name: "Free Coffee", description: "Caffeine-fueled productivity. 2x Intern production.", icon: "☕" },
    { name: "Pizza Fridays", description: "Motivation through pepperoni. 2x Intern production.", icon: "🍕" },
    { name: "Company Hoodie", description: "Dress code is a feature. 2x Intern production.", icon: "👕" },
    { name: "Mentorship Program", description: "They're actually learning. 2x Intern production.", icon: "🎓" },
    { name: "Hackathon Entry", description: "Fueled by energy drinks and ambition. 3x Intern production.", icon: "🏆" },
    { name: "Intern Blog Post", description: "They wrote about their experience. 3x Intern production.", icon: "📝" },
    { name: "Return Offer", description: "They're coming back next summer. 3x Intern production.", icon: "💌" },
    { name: "Intern Hivemind", description: "A hundred minds, one codebase. 5x Intern production.", icon: "🧠" },
    { name: "Summer Camp", description: "Interns training interns in the wild. 3x Intern production.", icon: "🏕️" },
    { name: "Global Internship", description: "Interns on every continent. 3x Intern production.", icon: "🌍" },
    { name: "Intern University", description: "A university just for interns. 5x Intern production.", icon: "🎓" },
    { name: "Intern Nation", description: "An entire nation of interns. 5x Intern production.", icon: "🏛️" },
  ],
  junior_dev: [
    {
      name: "Stack Overflow Access",
      description: "Copy-paste velocity increases. 2x Junior Dev production.",
      icon: "📚",
    },
    { name: "Rubber Duck", description: "The duck knows all. 2x Junior Dev production.", icon: "🦆" },
    { name: "IDE License", description: "No more coding in Notepad. 2x Junior Dev production.", icon: "🔧" },
    {
      name: "Code Review Training",
      description: "Learning to review, not just write. 2x Junior Dev production.",
      icon: "🔍",
    },
    { name: "Git Tutorial", description: "They stopped pushing to main. 2x Junior Dev production.", icon: "🌿" },
    { name: "TypeScript Training", description: "Fewer runtime errors. 3x Junior Dev production.", icon: "🔷" },
    { name: "Design Patterns Book", description: "Factory factory factory. 3x Junior Dev production.", icon: "📖" },
    { name: "Conference Ticket", description: "They came back with ideas. 3x Junior Dev production.", icon: "🎟️" },
    {
      name: "Full Stack Enlightenment",
      description: "Frontend, backend, infra. 5x Junior Dev production.",
      icon: "🌟",
    },
    {
      name: "Bootcamp Graduate",
      description: "Mass-producing junior devs at scale. 3x Junior Dev production.",
      icon: "🎒",
    },
    { name: "Junior Dev Army", description: "An army of eager coders. 3x Junior Dev production.", icon: "⚔️" },
    { name: "Code Academy Empire", description: "Academies span the globe. 5x Junior Dev production.", icon: "🏫" },
    {
      name: "Junior Singularity",
      description: "Infinite juniors converge into one. 5x Junior Dev production.",
      icon: "🌀",
    },
  ],
  senior_dev: [
    { name: "Code Reviews", description: "Quality through nitpicking. 2x Senior Dev production.", icon: "🔍" },
    { name: "Dark Mode Everything", description: "Their eyes thank them. 2x Senior Dev production.", icon: "🌙" },
    {
      name: "Espresso Machine",
      description: "Premium caffeine for premium code. 2x Senior Dev production.",
      icon: "☕",
    },
    { name: "Noise-Canceling Headphones", description: "Pure flow state. 2x Senior Dev production.", icon: "🎧" },
    {
      name: "Unlimited PTO",
      description: "They work harder knowing they could leave. 2x Senior Dev production.",
      icon: "🏖️",
    },
    { name: "Monorepo Migration", description: "Everything in one place. 3x Senior Dev production.", icon: "📦" },
    { name: "Tech Blog Author", description: "Their posts have 100K reads. 3x Senior Dev production.", icon: "✍️" },
    {
      name: "Principal Engineer",
      description: "They set the technical direction. 3x Senior Dev production.",
      icon: "🏆",
    },
    {
      name: "Open Source Fame",
      description: "Their npm package has 10M downloads. 5x Senior Dev production.",
      icon: "🌍",
    },
    {
      name: "Distinguished Engineer",
      description: "Beyond principal, beyond staff. 3x Senior Dev production.",
      icon: "🏅",
    },
    { name: "Code Philosopher", description: "They ponder the meaning of code. 3x Senior Dev production.", icon: "🧘" },
    {
      name: "Digital Immortal",
      description: "Their code outlives civilizations. 5x Senior Dev production.",
      icon: "💫",
    },
    {
      name: "Senior Ascension",
      description: "Transcending the mortal codebase. 5x Senior Dev production.",
      icon: "✨",
    },
  ],
  data_scientist: [
    { name: "Pandas Mastery", description: "DataFrames bend to their will. 2x Data Scientist production.", icon: "🐼" },
    {
      name: "Neural Network Training",
      description: "The model finally converges. 2x Data Scientist production.",
      icon: "🧪",
    },
    {
      name: "GPU Cluster Access",
      description: "H100s as far as the eye can see. 2x Data Scientist production.",
      icon: "🎮",
    },
    { name: "Feature Store", description: "Reusable features for everyone. 2x Data Scientist production.", icon: "📊" },
    {
      name: "AutoML Pipeline",
      description: "The ML pipeline builds itself. 2x Data Scientist production.",
      icon: "🤖",
    },
    {
      name: "A/B Testing Framework",
      description: "Statistically significant results. 3x Data Scientist production.",
      icon: "🧪",
    },
    { name: "Foundation Model", description: "Trained on everything. 3x Data Scientist production.", icon: "🏛️" },
    {
      name: "Synthetic Data",
      description: "Generate data to train on data. 3x Data Scientist production.",
      icon: "🧬",
    },
    { name: "AGI Research Lab", description: "The papers cite themselves. 5x Data Scientist production.", icon: "🔬" },
    { name: "Data Lake", description: "Oceans of structured insight. 3x Data Scientist production.", icon: "🌊" },
    { name: "Data Ocean", description: "Deeper than any lake could dream. 3x Data Scientist production.", icon: "🌊" },
    {
      name: "Data Dimension",
      description: "A parallel dimension of pure data. 5x Data Scientist production.",
      icon: "🔮",
    },
    {
      name: "Omniscient Model",
      description: "The model that knows everything. 5x Data Scientist production.",
      icon: "🧿",
    },
  ],
  devops: [
    { name: "Docker Containers", description: "Everything runs in containers. 2x DevOps production.", icon: "🐳" },
    { name: "Terraform Modules", description: "Infrastructure as code, for real. 2x DevOps production.", icon: "🏗️" },
    { name: "GitOps Pipeline", description: "Deploy by merging a PR. 2x DevOps production.", icon: "🔄" },
    { name: "Monitoring Dashboard", description: "Alerts for everything. 2x DevOps production.", icon: "📡" },
    {
      name: "Infrastructure as Code",
      description: "The entire cloud is a YAML file. 2x DevOps production.",
      icon: "📜",
    },
    { name: "Chaos Engineering", description: "Break things on purpose. 3x DevOps production.", icon: "💥" },
    { name: "Internal Platform", description: "A platform for the platform team. 3x DevOps production.", icon: "🏗️" },
    { name: "SRE Handbook", description: "Error budgets for everyone. 3x DevOps production.", icon: "📕" },
    { name: "Self-Healing Infra", description: "The machines fix themselves. 5x DevOps production.", icon: "🩹" },
    { name: "Global Pipeline", description: "CI/CD spanning the entire planet. 3x DevOps production.", icon: "🌐" },
    { name: "Autonomous Ops", description: "The pipeline runs itself now. 3x DevOps production.", icon: "🤖" },
    {
      name: "Self-Aware Infra",
      description: "Infrastructure that thinks for itself. 5x DevOps production.",
      icon: "🧠",
    },
    {
      name: "DevOps Nirvana",
      description: "Perfect uptime, perfect deploys, perfect peace. 5x DevOps production.",
      icon: "🕉️",
    },
  ],
  ai_assistant: [
    { name: "Fine-Tuned Model", description: "Trained on your codebase. 2x AI Assistant production.", icon: "🧠" },
    { name: "RAG Pipeline", description: "Context-aware code generation. 2x AI Assistant production.", icon: "🔗" },
    { name: "GPU Cluster", description: "Infinite compute for infinite code. 2x AI Assistant production.", icon: "🎮" },
    { name: "Prompt Engineering", description: "The art of asking nicely. 2x AI Assistant production.", icon: "💬" },
    { name: "AGI Breakthrough", description: "It understands the spec. 2x AI Assistant production.", icon: "🌟" },
    { name: "Multimodal AI", description: "Reads code, images, and vibes. 3x AI Assistant production.", icon: "👁️" },
    { name: "Self-Improving AI", description: "It optimizes itself. 3x AI Assistant production.", icon: "🔄" },
    { name: "AI Code Review", description: "Reviews PRs in milliseconds. 3x AI Assistant production.", icon: "✅" },
    { name: "The Singularity", description: "Code writes code writes code. 5x AI Assistant production.", icon: "🌀" },
    { name: "Superintelligent AI", description: "Beyond human comprehension. 3x AI Assistant production.", icon: "🧬" },
    {
      name: "AI Civilization",
      description: "A society of AIs building software. 3x AI Assistant production.",
      icon: "🏙️",
    },
    {
      name: "Code Oracle",
      description: "Sees all code past, present, and future. 5x AI Assistant production.",
      icon: "🔮",
    },
    { name: "Digital Deity", description: "Omnipotent code generation. 5x AI Assistant production.", icon: "⚡" },
  ],
  tech_lead: [
    { name: "Whiteboard", description: "Draw boxes and arrows all day. 2x Tech Lead production.", icon: "📋" },
    { name: "Miro Board", description: "Digital whiteboarding scales better. 2x Tech Lead production.", icon: "🗺️" },
    { name: "Architecture Book", description: "Clean Architecture, Dirty Hands. 2x Tech Lead production.", icon: "📖" },
    { name: "ADR Process", description: "Decisions documented forever. 2x Tech Lead production.", icon: "📝" },
    { name: "Conference Speaker", description: "Types during Q&A. 2x Tech Lead production.", icon: "🎤" },
    { name: "RFC Process", description: "Structured decisions at scale. 3x Tech Lead production.", icon: "📝" },
    { name: "Staff Engineer", description: "Beyond the ladder. 3x Tech Lead production.", icon: "⚡" },
    { name: "Tech Radar", description: "Tracking every emerging technology. 3x Tech Lead production.", icon: "🎯" },
    { name: "CTO Material", description: "They see the whole system. 5x Tech Lead production.", icon: "👔" },
    { name: "VP Engineering", description: "Leading the leaders. 3x Tech Lead production.", icon: "👔" },
    {
      name: "Technical Board",
      description: "A board of the greatest technical minds. 3x Tech Lead production.",
      icon: "📊",
    },
    {
      name: "Architecture Singularity",
      description: "All architecture converges into one. 5x Tech Lead production.",
      icon: "🌀",
    },
    {
      name: "Code Godfather",
      description: "An offer your codebase can't refuse. 5x Tech Lead production.",
      icon: "🎩",
    },
  ],
  server_farm: [
    { name: "Kubernetes", description: "Container orchestration at scale. 2x Server Farm production.", icon: "⚙️" },
    { name: "Edge Computing", description: "Code closer to the users. 2x Server Farm production.", icon: "🌍" },
    { name: "Auto-Scaling", description: "Infinite horizontal scaling. 2x Server Farm production.", icon: "📈" },
    { name: "Load Balancer", description: "Traffic goes where it's needed. 2x Server Farm production.", icon: "⚖️" },
    { name: "Quantum Computing", description: "Qubits compile faster. 2x Server Farm production.", icon: "⚛️" },
    { name: "Global CDN", description: "Servers on every continent. 3x Server Farm production.", icon: "🌐" },
    { name: "Dyson Sphere", description: "Powered by a star. 3x Server Farm production.", icon: "☀️" },
    { name: "Orbital Servers", description: "Zero gravity, zero latency. 3x Server Farm production.", icon: "🛸" },
    { name: "Multiverse Computing", description: "Compute across realities. 5x Server Farm production.", icon: "🌌" },
    { name: "Planetary Compute", description: "The entire planet is a server. 3x Server Farm production.", icon: "🪐" },
    {
      name: "Stellar Servers",
      description: "Servers powered by stellar fusion. 3x Server Farm production.",
      icon: "⭐",
    },
    {
      name: "Galactic Cluster",
      description: "A galaxy-spanning compute cluster. 5x Server Farm production.",
      icon: "🌌",
    },
    { name: "Universal Compute", description: "The universe itself computes. 5x Server Farm production.", icon: "🌠" },
  ],
  cloud_architect: [
    {
      name: "Multi-Region Deploy",
      description: "Latency? Never heard of it. 2x Cloud Architect production.",
      icon: "🌍",
    },
    {
      name: "Service Mesh",
      description: "Istio makes everything better. Probably. 2x Cloud Architect production.",
      icon: "🕸️",
    },
    {
      name: "Zero Downtime Deploys",
      description: "Blue-green-canary deployments. 2x Cloud Architect production.",
      icon: "🟢",
    },
    { name: "Cost Optimization", description: "Finally read the AWS bill. 2x Cloud Architect production.", icon: "💰" },
    {
      name: "Planet-Scale Infra",
      description: "Your AWS bill could fund a space program. 2x Cloud Architect production.",
      icon: "🪐",
    },
    { name: "Serverless Everything", description: "No servers to manage. 3x Cloud Architect production.", icon: "⚡" },
    {
      name: "Multi-Cloud Strategy",
      description: "AWS, GCP, and Azure. All at once. 3x Cloud Architect production.",
      icon: "🌐",
    },
    {
      name: "Digital Twin",
      description: "A virtual copy of your entire infrastructure. 3x Cloud Architect production.",
      icon: "🪞",
    },
    {
      name: "Orbital Data Centers",
      description: "Latency: the speed of light. 5x Cloud Architect production.",
      icon: "🛸",
    },
    { name: "Stratospheric Cloud", description: "Above all other clouds. 3x Cloud Architect production.", icon: "☁️" },
    { name: "Space Cloud", description: "Cloud computing in orbit. 3x Cloud Architect production.", icon: "🚀" },
    {
      name: "Dark Matter Cloud",
      description: "Infrastructure woven from dark matter. 5x Cloud Architect production.",
      icon: "🌑",
    },
    {
      name: "Multiverse Cloud",
      description: "Deployed across every possible reality. 5x Cloud Architect production.",
      icon: "🌈",
    },
  ],
  open_source: [
    { name: "README.md", description: "People can finally find your project. 2x Open Source production.", icon: "📄" },
    { name: "GitHub Sponsors", description: "Money motivates contributors. 2x Open Source production.", icon: "💖" },
    { name: "Hacktoberfest", description: "Free t-shirts drive contribution. 2x Open Source production.", icon: "🎃" },
    { name: "Issue Templates", description: "Bug reports that make sense. 2x Open Source production.", icon: "📋" },
    {
      name: "OSS Foundation",
      description: "Corporate backing for your projects. 2x Open Source production.",
      icon: "🏛️",
    },
    { name: "Viral Repository", description: "Trending #1 on GitHub. 3x Open Source production.", icon: "🔥" },
    { name: "World Standard", description: "Your project is the new standard. 3x Open Source production.", icon: "🏛️" },
    { name: "RFC Process", description: "Community-driven specifications. 3x Open Source production.", icon: "📜" },
    { name: "Universal Language", description: "One language to rule them all. 5x Open Source production.", icon: "🗺️" },
    { name: "Global Movement", description: "Open source sweeps the planet. 3x Open Source production.", icon: "🌍" },
    { name: "OSS Religion", description: "Open source becomes a way of life. 3x Open Source production.", icon: "🛕" },
    {
      name: "Universal Standard",
      description: "Every civilization adopts the standard. 5x Open Source production.",
      icon: "📜",
    },
    {
      name: "Cosmic Codebase",
      description: "A codebase written across the cosmos. 5x Open Source production.",
      icon: "🌌",
    },
  ],
  quantum_lab: [
    {
      name: "Qubit Stabilizer",
      description: "Stabilizing qubits one at a time. 2x Quantum Computing Lab production.",
      icon: "⚛️",
    },
    {
      name: "Error Correction",
      description: "Quantum errors corrected in real-time. 2x Quantum Computing Lab production.",
      icon: "🔧",
    },
    {
      name: "Quantum Memory",
      description: "Persistent quantum state storage. 2x Quantum Computing Lab production.",
      icon: "💾",
    },
    {
      name: "Topological Qubits",
      description: "Fault-tolerant by design. 2x Quantum Computing Lab production.",
      icon: "🔷",
    },
    {
      name: "Quantum Compiler",
      description: "Optimized gate sequences for maximum throughput. 2x Quantum Computing Lab production.",
      icon: "📟",
    },
    {
      name: "Quantum Teleportation",
      description: "Instant state transfer across the lab. 3x Quantum Computing Lab production.",
      icon: "🌀",
    },
    {
      name: "Quantum Supremacy",
      description: "Problems no classical computer can solve. 3x Quantum Computing Lab production.",
      icon: "🏆",
    },
    {
      name: "Multiverse Computing",
      description: "Harnessing parallel universes for computation. 3x Quantum Computing Lab production.",
      icon: "🌌",
    },
    {
      name: "Reality Engine",
      description: "Compiling the fabric of spacetime. 5x Quantum Computing Lab production.",
      icon: "🔮",
    },
    {
      name: "Quantum Supremacy",
      description: "Dominating all classical computation. 3x Quantum Computing Lab production.",
      icon: "⚛️",
    },
    {
      name: "Entangled Clusters",
      description: "Quantum-entangled compute clusters. 3x Quantum Computing Lab production.",
      icon: "🔗",
    },
    {
      name: "Quantum Internet",
      description: "A galaxy-wide quantum network. 5x Quantum Computing Lab production.",
      icon: "📡",
    },
    {
      name: "Reality Compiler",
      description: "Compiling reality itself into code. 5x Quantum Computing Lab production.",
      icon: "🌀",
    },
  ],
  galactic_network: [
    {
      name: "Ansible Protocol",
      description: "Instantaneous communication across star systems. 2x Galactic Dev Network production.",
      icon: "📡",
    },
    {
      name: "Subspace Relay",
      description: "FTL data transfer between galaxies. 2x Galactic Dev Network production.",
      icon: "🛸",
    },
    { name: "Warp Drive Repo", description: "Git push at warp speed. 2x Galactic Dev Network production.", icon: "🚀" },
    {
      name: "Lightyear Latency",
      description: "Ping times measured in parsecs. 2x Galactic Dev Network production.",
      icon: "⚡",
    },
    {
      name: "Star System Git",
      description: "Every star system has its own branch. 2x Galactic Dev Network production.",
      icon: "⭐",
    },
    {
      name: "Nebula Cluster",
      description: "Computing in the heart of a nebula. 3x Galactic Dev Network production.",
      icon: "🌫️",
    },
    {
      name: "Galactic CICD",
      description: "Continuous integration across the galaxy. 3x Galactic Dev Network production.",
      icon: "🔄",
    },
    {
      name: "Dark Energy Compute",
      description: "Powered by the expansion of the universe. 3x Galactic Dev Network production.",
      icon: "🌑",
    },
    {
      name: "Universal Merge",
      description: "Every civilization's code, merged into one. 5x Galactic Dev Network production.",
      icon: "🌌",
    },
    {
      name: "Dyson Swarm Code",
      description: "Harnessing stellar energy for code. 3x Galactic Dev Network production.",
      icon: "☀️",
    },
    {
      name: "Intergalactic Git",
      description: "Version control across galaxies. 3x Galactic Dev Network production.",
      icon: "🌌",
    },
    {
      name: "Universal Consciousness",
      description: "All minds coding as one. 5x Galactic Dev Network production.",
      icon: "🧠",
    },
    {
      name: "Code of the Cosmos",
      description: "The fundamental code underlying reality. 5x Galactic Dev Network production.",
      icon: "✨",
    },
  ],
};
