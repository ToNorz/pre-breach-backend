const API_BASE = "http://localhost:8080";

async function testE2E() {
  console.log("Starting E2E tests...");

  // 1. Register a new user
  const registerRes = await fetch(`${API_BASE}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `test${Date.now()}@example.com`, username: `test${Date.now()}`, password: "password123" })
  });
  if (!registerRes.ok) throw new Error("Registration failed: " + await registerRes.text());
  const registerData = await registerRes.json();
  const token = registerData.token;
  console.log("Registered new user. Token length:", token.length);

  // 2. Create a team
  const teamRes = await fetch(`${API_BASE}/teams`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ name: `team${Date.now()}` })
  });
  if (!teamRes.ok) throw new Error("Create team failed: " + await teamRes.text());
  console.log("Team created successfully");

  // 3. Get the board
  const boardRes = await fetch(`${API_BASE}/board`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  if (!boardRes.ok) throw new Error("Get board failed: " + await boardRes.text());
  const boardData = await boardRes.json();
  console.log("Fetched board. Challenges count:", boardData.challenges.length);

  // Find an open challenge
  const openChallenge = boardData.challenges.find((c: any) => c.status === "open");
  if (!openChallenge) throw new Error("No open challenges found!");
  console.log(`Found open challenge: ${openChallenge.title} (${openChallenge.points} PTS)`);

  // 3. Submit a flag (intentionally wrong)
  const submitRes1 = await fetch(`${API_BASE}/challenges/${openChallenge.id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({ flag: "wrong_flag" })
  });
  const submitData1 = await submitRes1.json();
  console.log("Submit wrong flag result:", submitData1);

  // 4. Get Leaderboard
  const leaderRes = await fetch(`${API_BASE}/leaderboard`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const leaderData = await leaderRes.json();
  console.log("Leaderboard:", JSON.stringify(leaderData).slice(0, 200));

  console.log("E2E tests passed successfully!");
}

testE2E().catch(console.error);
