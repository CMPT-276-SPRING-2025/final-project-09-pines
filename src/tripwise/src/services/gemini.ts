export async function fetchChatResponse(feature: string, query: string): Promise<string> {
    let endpoint = '';
    switch(feature) {
        case 'travel':
            endpoint = '/api/flights/chat';
            break;
        case 'review':
            endpoint = '/api/reviews/chat';
            break;
        case 'alert':
            endpoint = '/api/alerts/chat';
            break;
        default:
            throw new Error('Invalid feature');
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
    });
    const data = await response.json();
    return data.message;
}