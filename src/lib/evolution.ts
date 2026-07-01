export const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'https://imobhunter.up.railway.app';
export const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || ''; // Deve ser configurado no .env

export const ADMIN_INSTANCE_NAME = 'crm-admin';

export async function getInstanceStatus(instanceName: string = ADMIN_INSTANCE_NAME) {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connectionState/${instanceName}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      },
      cache: 'no-store'
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Error fetching instance status:', err);
    return null;
  }
}

export async function createInstance(instanceName: string = ADMIN_INSTANCE_NAME) {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        instanceName,
        token: instanceName,
        qrcode: true
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Error creating instance:', err);
    return null;
  }
}

export async function connectInstance(instanceName: string = ADMIN_INSTANCE_NAME) {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
      headers: {
        'apikey': EVOLUTION_API_KEY
      },
      cache: 'no-store'
    });
    return await res.json();
  } catch (err) {
    console.error('Error connecting instance:', err);
    return null;
  }
}

export async function logoutInstance(instanceName: string = ADMIN_INSTANCE_NAME) {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/instance/logout/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': EVOLUTION_API_KEY
      }
    });
    return await res.json();
  } catch (err) {
    console.error('Error logging out instance:', err);
    return null;
  }
}

export async function sendText(instanceName: string, number: string, text: string) {
  try {
    const res = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_API_KEY
      },
      body: JSON.stringify({
        number,
        options: {
          delay: 3000,
          presence: 'composing'
        },
        textMessage: {
          text
        }
      })
    });
    return await res.json();
  } catch (err) {
    console.error('Error sending text:', err);
    return null;
  }
}
