// Test function to check environment variables
exports.handler = async (event, context) => {
  try {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminPasswordExists: !!process.env.ADMIN_PASSWORD,
        adminPasswordLength: process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0,
        fallbackPassword: 'change_this_admin_password_123',
        allEnvKeys: Object.keys(process.env).filter(key => 
          key.includes('ADMIN') || 
          key.includes('CLAUDE') || 
          key.includes('ELEVEN')
        )
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};