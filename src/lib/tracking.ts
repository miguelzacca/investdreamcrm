export async function trackLeadContact(leadId: string) {
  try {
    const res = await fetch(`/api/leads/${leadId}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      console.error('Failed to track lead contact', await res.text());
    }
  } catch (error) {
    console.error('Error tracking lead contact:', error);
  }
}
