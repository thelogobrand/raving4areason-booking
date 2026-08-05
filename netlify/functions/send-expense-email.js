export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const { expense } = JSON.parse(event.body || "{}");
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: "RESEND_API_KEY missing" }) };
    }

    const lines = [
      "New Raving 4 A Reason Expense",
      "",
      `Mentor: ${expense.mentor || ""}`,
      `Date: ${expense.expense_date || ""}`,
      `Type: ${expense.expense_type === "mileage" ? "Mileage" : (expense.category || "Expense")}`,
      expense.miles ? `Miles: ${expense.miles}` : null,
      expense.mileage_rate ? `Rate: £${Number(expense.mileage_rate).toFixed(2)} per mile` : null,
      `Amount: £${Number(expense.amount || 0).toFixed(2)}`,
      `Reason: ${expense.reason || ""}`,
      expense.receipt_url ? `Receipt: ${expense.receipt_url}` : null
    ].filter(Boolean).join("
");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Raving 4 A Reason <onboarding@resend.dev>",
        to: ["Raving4areason1@outlook.com"],
        subject: `New expense from ${expense.mentor || "mentor"}`,
        html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap">${lines.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}</pre>`
      })
    });

    const data = await response.json();
    return { statusCode: response.ok ? 200 : response.status, body: JSON.stringify(data) };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
}
