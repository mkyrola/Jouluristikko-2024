// In-memory cache for tokens (in production, consider using Redis or Netlify KV)
let tokenCache = {
    accessToken: null,
    expiresAt: null
};

// Rate limiting store (in production, consider using Redis or Netlify KV)
const submissionCache = {
    ips: {},
    emails: {}
};

// Helper function to get or refresh Zoho access token
async function getAccessToken() {
    // Check if we have a valid cached token
    if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
        return tokenCache.accessToken;
    }

    // Refresh the token
    const response = await fetch('https://accounts.zoho.com/oauth/v2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            refresh_token: process.env.ZOHO_REFRESH_TOKEN,
            client_id: process.env.ZOHO_CLIENT_ID,
            client_secret: process.env.ZOHO_CLIENT_SECRET,
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to refresh Zoho token');
    }

    const data = await response.json();
    
    // Cache the new token with expiry (5 minutes before actual expiry)
    tokenCache.accessToken = data.access_token;
    tokenCache.expiresAt = Date.now() + (data.expires_in - 300) * 1000;

    return data.access_token;
}

// Helper function to check rate limiting
function checkRateLimit(ip, email) {
    const now = Date.now();
    const yesterday = now - (24 * 60 * 60 * 1000);

    // Clean up old entries
    Object.keys(submissionCache.ips).forEach(key => {
        if (submissionCache.ips[key] < yesterday) {
            delete submissionCache.ips[key];
        }
    });

    Object.keys(submissionCache.emails).forEach(key => {
        if (submissionCache.emails[key] < yesterday) {
            delete submissionCache.emails[key];
        }
    });

    // Check IP
    if (submissionCache.ips[ip]) {
        return { allowed: false, message: "Olet jo lähettänyt vastauksen tähän ristikkoon." };
    }

    // Check email
    const lowerEmail = email.toLowerCase();
    if (submissionCache.emails[lowerEmail]) {
        return { allowed: false, message: "Sähköpostiosoitteella on jo lähetetty vastaus." };
    }

    // Don't record yet - just check if allowed
    return { allowed: true };
}

// Helper function to record successful submission
function recordSubmission(ip, email) {
    const now = Date.now();
    submissionCache.ips[ip] = now;
    submissionCache.emails[email.toLowerCase()] = now;
}

// Main handler
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse request body
        const data = JSON.parse(event.body);
        
        // Get client IP
        const clientIp = event.headers['x-forwarded-for'] || 
                        event.headers['x-real-ip'] || 
                        event.requestContext.identity.sourceIp || 
                        'unknown';

        // Validate required fields
        const requiredFields = ['name', 'email', 'phone'];
        for (const field of requiredFields) {
            if (!data[field] || !data[field].trim()) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: `Missing required field: ${field}` })
                };
            }
        }

        // Check rate limiting
        const email = data.email.trim().toLowerCase();
        const rateCheck = checkRateLimit(clientIp, email);
        if (!rateCheck.allowed) {
            return {
                statusCode: 429,
                body: JSON.stringify({ error: rateCheck.message })
            };
        }

        // Get Zoho access token
        const accessToken = await getAccessToken();

        // Format HTML description
        const description = `
        <h3>Jouluristikko 2025 - Vastaus</h3>
        <p><strong>Nimi:</strong> ${data.name.trim()}</p>
        <p><strong>Sähköposti:</strong> ${data.email.trim()}</p>
        <p><strong>Puhelin:</strong> ${data.phone.trim()}</p>
        ${data.organization ? `<p><strong>Yritys/Organisaatio:</strong> ${data.organization.trim()}</p>` : ''}
        <p><strong>IP-osoite:</strong> ${clientIp}</p>
        <p><strong>Lähetysaika:</strong> ${new Date().toLocaleString('fi-FI')}</p>
        <hr>
        <p>Käyttäjä on täyttänyt jouluristikon ja osallistuu arvontaan.</p>
        `;

        // Create ticket
        const ticketData = {
            subject: `Jouluristikko 2025 - ${data.name.trim()}`,
            departmentId: '35204000077348035',
            contactId: '35204000107100168',
            description: description.trim(),
            status: 'Open',
            channel: 'Web',
            language: 'fi-FI',
            category: 'Jouluristikko 2025',
            subCategory: 'Arvonta'
        };

        const ticketResponse = await fetch('https://desk.zoho.com/api/v1/tickets', {
            method: 'POST',
            headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
                'Content-Type': 'application/json',
                'orgId': process.env.ZOHO_ORG_ID || '22905616'
            },
            body: JSON.stringify(ticketData)
        });

        if (!ticketResponse.ok) {
            throw new Error('Failed to create ticket');
        }

        const ticket = await ticketResponse.json();

        // Record successful submission for rate limiting
        recordSubmission(clientIp, email);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Ticket created successfully',
                ticketId: ticket.id
            })
        };

    } catch (error) {
        console.error('Error in submit function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};
