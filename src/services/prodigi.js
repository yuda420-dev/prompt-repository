// Prodigi Print-on-Demand Integration
// API Documentation: https://www.prodigi.com/print-api/docs/reference/

const PRODIGI_API_URL = import.meta.env.VITE_PRODIGI_API_URL || 'https://api.sandbox.prodigi.com/v4.0';
const PRODIGI_API_KEY = import.meta.env.VITE_PRODIGI_API_KEY;

// Map our sizes to Prodigi SKUs
// Using Global Fine Art Canvas prints (giclée, museum-quality)
// Format: GLOBAL-FAC-{SIZE} for Fine Art Canvas
// Format: GLOBAL-CFPM-{SIZE} for Classic Framed Print Mounted
export const PRODIGI_SKUS = {
  canvas: {
    'Small': 'GLOBAL-FAC-12X12',      // 12x12" Fine Art Canvas
    'Medium': 'GLOBAL-FAC-24X24',     // 24x24" Fine Art Canvas
    'Large': 'GLOBAL-FAC-36X36',      // 36x36" Fine Art Canvas
    'Grand': 'GLOBAL-FAC-48X48',      // 48x48" Fine Art Canvas
  },
  framed: {
    'Small': 'GLOBAL-CFPM-12X12',     // 12x12" Classic Framed Print
    'Medium': 'GLOBAL-CFPM-24X24',    // 24x24" Classic Framed Print
    'Large': 'GLOBAL-CFPM-36X36',     // 36x36" Classic Framed Print
    'Grand': 'GLOBAL-CFPM-40X40',     // 40x40" Classic Framed Print (closest to 48)
  }
};

// Frame color mapping to Prodigi attributes
export const FRAME_COLORS = {
  'black': 'black',
  'white': 'white',
  'natural': 'natural',
  'walnut': 'brown',      // Prodigi uses 'brown' for walnut
  'gold': 'antique_gold',
};

// Check if Prodigi is configured
export const isProdigiConfigured = () => {
  return !!PRODIGI_API_KEY;
};

// Create an order with Prodigi
export const createProdigiOrder = async (orderData) => {
  if (!isProdigiConfigured()) {
    console.warn('Prodigi API key not configured');
    return { success: false, error: 'Print fulfillment not configured' };
  }

  const { items, shippingAddress, customerEmail, merchantReference } = orderData;

  // Build Prodigi order items
  const prodigiItems = items.map(item => {
    const isFramed = item.frame.name !== 'none';
    const skuMap = isFramed ? PRODIGI_SKUS.framed : PRODIGI_SKUS.canvas;
    const sku = skuMap[item.size.name];

    const orderItem = {
      sku: sku,
      copies: 1,
      sizing: 'fillPrintArea',
      assets: [{
        printArea: 'default',
        url: item.artwork.image, // The artwork image URL
      }],
    };

    // Add frame color attribute if framed
    if (isFramed && FRAME_COLORS[item.frame.name]) {
      orderItem.attributes = {
        frameColour: FRAME_COLORS[item.frame.name],
      };
    }

    return orderItem;
  });

  const order = {
    merchantReference: merchantReference || `HIPER-${Date.now()}`,
    shippingMethod: 'Standard',
    recipient: {
      name: shippingAddress.name,
      email: customerEmail,
      address: {
        line1: shippingAddress.line1,
        line2: shippingAddress.line2 || undefined,
        townOrCity: shippingAddress.city,
        stateOrCounty: shippingAddress.state,
        postalOrZipCode: shippingAddress.postalCode,
        countryCode: shippingAddress.country,
      },
    },
    items: prodigiItems,
  };

  try {
    const response = await fetch(`${PRODIGI_API_URL}/orders`, {
      method: 'POST',
      headers: {
        'X-API-Key': PRODIGI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Prodigi order failed:', data);
      return {
        success: false,
        error: data.message || 'Failed to create print order',
        details: data,
      };
    }

    return {
      success: true,
      orderId: data.order.id,
      status: data.order.status.stage,
      order: data.order,
    };
  } catch (error) {
    console.error('Prodigi API error:', error);
    return {
      success: false,
      error: 'Network error connecting to print service',
    };
  }
};

// Get order status
export const getOrderStatus = async (orderId) => {
  if (!isProdigiConfigured()) {
    return { success: false, error: 'Print fulfillment not configured' };
  }

  try {
    const response = await fetch(`${PRODIGI_API_URL}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': PRODIGI_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message };
    }

    return {
      success: true,
      order: data.order,
      status: data.order.status.stage,
      shipments: data.order.shipments || [],
    };
  } catch (error) {
    console.error('Prodigi status check error:', error);
    return { success: false, error: 'Failed to check order status' };
  }
};

// Get shipping quote (optional - for showing shipping costs)
export const getShippingQuote = async (destinationCountry, items) => {
  if (!isProdigiConfigured()) {
    return { success: false, error: 'Print fulfillment not configured' };
  }

  try {
    const response = await fetch(`${PRODIGI_API_URL}/quotes`, {
      method: 'POST',
      headers: {
        'X-API-Key': PRODIGI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        shippingMethod: 'Standard',
        destinationCountryCode: destinationCountry,
        items: items.map(item => ({
          sku: item.sku,
          copies: 1,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message };
    }

    return {
      success: true,
      quotes: data.quotes,
    };
  } catch (error) {
    console.error('Prodigi quote error:', error);
    return { success: false, error: 'Failed to get shipping quote' };
  }
};
