// app/api/absa/transactions/route.js
import { NextResponse } from 'next/server';

const ABSA_BASE_URL = 'https://gw-sb.api.absa.africa/PlaypenTrxHistory/1.1.4';

export async function GET() {
  try {
    const response = await fetch(`${ABSA_BASE_URL}/transactions`, {
      headers: {
        'Authorization': `Bearer ${process.env.ABSA_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('ABSA API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' }, 
      { status: 500 }
    );
  }
}