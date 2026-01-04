import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Analytics service - stores data in Supabase for admin to see all users' activity

// Track a page view
export const trackPageView = async (page = 'home', userId = null) => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('analytics_events').insert({
      event_type: 'page_view',
      page,
      user_id: userId,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track artwork view
export const trackArtworkView = async (artworkId, artworkTitle, userId = null) => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('analytics_events').insert({
      event_type: 'artwork_view',
      artwork_id: artworkId,
      artwork_title: artworkTitle,
      user_id: userId,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking artwork view:', error);
  }
};

// Track cart addition
export const trackCartAdd = async (artworkId, artworkTitle, size, frame, price, userId = null) => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('analytics_events').insert({
      event_type: 'cart_add',
      artwork_id: artworkId,
      artwork_title: artworkTitle,
      size_name: size,
      frame_name: frame,
      price,
      user_id: userId,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking cart add:', error);
  }
};

// Track checkout start
export const trackCheckoutStart = async (cartTotal, itemCount, userId = null) => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('analytics_events').insert({
      event_type: 'checkout_start',
      price: cartTotal,
      item_count: itemCount,
      user_id: userId,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking checkout start:', error);
  }
};

// Track order completion
export const trackOrderComplete = async (orderId, cartTotal, items, userId = null) => {
  if (!isSupabaseConfigured()) return;

  try {
    // Insert main order event
    await supabase.from('analytics_events').insert({
      event_type: 'order_complete',
      order_id: orderId,
      price: cartTotal,
      item_count: items.length,
      user_id: userId,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    });

    // Insert individual sale records for each item
    for (const item of items) {
      await supabase.from('analytics_sales').insert({
        order_id: orderId,
        artwork_id: item.artwork.id,
        artwork_title: item.artwork.title,
        size_name: item.size.name,
        frame_name: item.frame.name,
        price: item.total,
        user_id: userId,
        created_at: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error tracking order complete:', error);
  }
};

// Track favorite action
export const trackFavorite = async (artworkId, artworkTitle, action = 'add', userId = null) => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('analytics_events').insert({
      event_type: action === 'add' ? 'favorite_add' : 'favorite_remove',
      artwork_id: artworkId,
      artwork_title: artworkTitle,
      user_id: userId,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking favorite:', error);
  }
};

// Track session start
export const trackSessionStart = async (userId = null) => {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase.from('analytics_events').insert({
      event_type: 'session_start',
      user_id: userId,
      device_type: getDeviceType(),
      created_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking session start:', error);
  }
};

// Get device type
const getDeviceType = () => {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// ============ ADMIN FUNCTIONS ============

// Get aggregated analytics for admin dashboard
export const getAnalyticsSummary = async (days = 30) => {
  if (!isSupabaseConfigured()) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  try {
    // Get all events for the period
    const { data: events, error } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get sales data
    const { data: sales, error: salesError } = await supabase
      .from('analytics_sales')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (salesError) throw salesError;

    // Aggregate the data
    const summary = {
      // Page views
      totalPageViews: events.filter(e => e.event_type === 'page_view').length,
      totalArtworkViews: events.filter(e => e.event_type === 'artwork_view').length,
      totalSessions: events.filter(e => e.event_type === 'session_start').length,

      // Shop metrics
      totalCartAdds: events.filter(e => e.event_type === 'cart_add').length,
      totalCheckoutStarts: events.filter(e => e.event_type === 'checkout_start').length,
      totalOrders: events.filter(e => e.event_type === 'order_complete').length,
      totalRevenue: events.filter(e => e.event_type === 'order_complete').reduce((sum, e) => sum + (e.price || 0), 0),

      // Favorites
      totalFavorites: events.filter(e => e.event_type === 'favorite_add').length,

      // Device breakdown
      deviceTypes: {
        mobile: events.filter(e => e.device_type === 'mobile').length,
        tablet: events.filter(e => e.device_type === 'tablet').length,
        desktop: events.filter(e => e.device_type === 'desktop').length,
      },

      // Unique users (by user_id)
      uniqueUsers: [...new Set(events.filter(e => e.user_id).map(e => e.user_id))].length,

      // Popular artworks (by views)
      popularArtworks: aggregateByField(events.filter(e => e.event_type === 'artwork_view'), 'artwork_title'),

      // Popular sizes (from cart adds and sales)
      popularSizes: aggregateByField([...events.filter(e => e.event_type === 'cart_add'), ...sales], 'size_name'),

      // Popular frames
      popularFrames: aggregateByField([...events.filter(e => e.event_type === 'cart_add'), ...sales], 'frame_name'),

      // Top selling artworks (by revenue)
      topSellingArtworks: aggregateSales(sales),

      // Daily breakdown
      dailyStats: aggregateByDay(events),

      // Hourly activity
      hourlyActivity: aggregateByHour(events),

      // Conversion rate
      conversionRate: events.filter(e => e.event_type === 'checkout_start').length > 0
        ? Math.round((events.filter(e => e.event_type === 'order_complete').length / events.filter(e => e.event_type === 'checkout_start').length) * 100)
        : 0,

      // Average order value
      averageOrderValue: events.filter(e => e.event_type === 'order_complete').length > 0
        ? Math.round(events.filter(e => e.event_type === 'order_complete').reduce((sum, e) => sum + (e.price || 0), 0) / events.filter(e => e.event_type === 'order_complete').length)
        : 0,
    };

    return summary;
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return null;
  }
};

// Helper: Aggregate by field
const aggregateByField = (items, field) => {
  const counts = {};
  items.forEach(item => {
    const value = item[field];
    if (value) {
      counts[value] = (counts[value] || 0) + 1;
    }
  });
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
};

// Helper: Aggregate sales by artwork
const aggregateSales = (sales) => {
  const artworks = {};
  sales.forEach(sale => {
    const id = sale.artwork_id;
    if (!artworks[id]) {
      artworks[id] = { title: sale.artwork_title, count: 0, revenue: 0 };
    }
    artworks[id].count += 1;
    artworks[id].revenue += sale.price || 0;
  });
  return Object.entries(artworks)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
};

// Helper: Aggregate by day
const aggregateByDay = (events) => {
  const days = {};
  events.forEach(event => {
    const day = event.created_at.split('T')[0];
    if (!days[day]) {
      days[day] = { views: 0, sessions: 0, orders: 0, revenue: 0 };
    }
    if (event.event_type === 'page_view' || event.event_type === 'artwork_view') {
      days[day].views += 1;
    }
    if (event.event_type === 'session_start') {
      days[day].sessions += 1;
    }
    if (event.event_type === 'order_complete') {
      days[day].orders += 1;
      days[day].revenue += event.price || 0;
    }
  });
  return days;
};

// Helper: Aggregate by hour
const aggregateByHour = (events) => {
  const hours = {};
  for (let i = 0; i < 24; i++) {
    hours[i] = 0;
  }
  events.forEach(event => {
    const hour = new Date(event.created_at).getHours();
    hours[hour] += 1;
  });
  return hours;
};
