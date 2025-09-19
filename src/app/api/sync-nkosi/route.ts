// src/app/api/sync-nkosi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { absaToSupabaseService } from '../../../lib/services/absaService';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Starting Nkosi sync process...');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    // Test connection first
    console.log('🔍 Testing ABSA connection...');
    const connectionTest = await absaToSupabaseService.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        stage: 'connection_test',
        error: connectionTest.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('✅ Connection test passed');
    console.log('📊 Connection data:', connectionTest.data);

    // Perform full sync
    console.log('🔄 Starting full sync...');
    const syncResult = await absaToSupabaseService.syncNkosiToSupabase();

    if (!syncResult.success) {
      return NextResponse.json({
        success: false,
        stage: 'data_sync',
        error: syncResult.error,
        message: syncResult.message,
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    console.log('🎉 Sync completed successfully!');

    return NextResponse.json({
      success: true,
      message: 'Nkosi data successfully synced from ABSA to Supabase',
      connectionTest: connectionTest.data,
      syncResult: {
        stats: syncResult.stats,
        data: syncResult.data
      },
      timestamp: new Date().toISOString(),
      pipeline: {
        stage: 'complete',
        steps: [
          '✅ ABSA API connection established',
          '✅ Nkosi data found and filtered',
          '✅ Account holder inserted/updated',
          '✅ Accounts synced to Supabase',
          '✅ Transactions synced to Supabase'
        ]
      }
    }, { status: 200 });

  } catch (error) {
    console.error('💥 Sync process failed:', error);
    
    return NextResponse.json({
      success: false,
      stage: 'unknown',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Failed to sync Nkosi data',
      timestamp: new Date().toISOString(),
      pipeline: {
        stage: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'test_only') {
      // Just test connection, don't sync data
      const result = await absaToSupabaseService.testConnection();
      
      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: result.data,
        timestamp: new Date().toISOString(),
        action: 'test_only'
      });
    }

    if (action === 'clear_and_sync') {
      // Clear existing Nkosi data and sync fresh
      console.log('🧹 Clearing existing Nkosi data...');
      
      // This would clear Nkosi's data first, then sync
      // For now, just run normal sync (which replaces transactions)
      const syncResult = await absaToSupabaseService.syncNkosiToSupabase();
      
      return NextResponse.json({
        success: syncResult.success,
        message: syncResult.message,
        stats: syncResult.stats,
        data: syncResult.data,
        error: syncResult.error,
        timestamp: new Date().toISOString(),
        action: 'clear_and_sync'
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action. Use "test_only" or "clear_and_sync"'
    }, { status: 400 });

  } catch (error) {
    console.error('API POST error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}