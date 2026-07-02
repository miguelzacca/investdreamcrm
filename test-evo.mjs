const EVOLUTION_API_URL = 'https://imobhunter.up.railway.app'
const EVOLUTION_API_KEY = 'QpmZtsrwkBUYkw9LLXBP4Lx6rO+b0pOe3WwDqh+wt6U='

async function test() {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/crm-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: '5547997431069',
        text: 'Test from API',
      }),
    })

    const data = await res.json()
    console.log('Status:', res.status)
    console.log('Data:', data)
  } catch (err) {
    console.error('Error:', err)
  }
}

test()
