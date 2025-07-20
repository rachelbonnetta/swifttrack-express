import React, { useState, useEffect } from 'react';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [trackingId, setTrackingId] = useState('');
  const [formValues, setFormValues] = useState({
    sender: '',
    recipient: '',
    origin: '',
    destination: '',
    weight: '',
    description: ''
  });
  const [shipments, setShipments] = useState({});

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === '') {
        setCurrentView('home');
      } else if (hash.startsWith('/create')) {
        setCurrentView('create');
      } else if (hash.startsWith('/dashboard/')) {
        const id = hash.split('/dashboard/')[1];
        setTrackingId(id);
        setCurrentView('dashboard');
      } else if (hash.startsWith('/track/')) {
        const id = hash.split('/track/')[1];
        setTrackingId(id);
        setCurrentView('track');
      } else if (hash.startsWith('/receipt/')) {
        const id = hash.split('/receipt/')[1];
        setTrackingId(id);
        setCurrentView('receipt');
      } else if (hash === '/admin') {
        setCurrentView('admin');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Load shipments from Firebase
  useEffect(() => {
    const { shipmentsCollection, onSnapshot } = window.firebaseDB;

    const unsubscribe = onSnapshot(shipmentsCollection, (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setShipments(data);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues({ ...formValues, [name]: value });
  };

  const generateTrackingId = () => {
    return `SWIF${Math.floor(100000 + Math.random() * 900000)}`;
  };

  const handleCreateShipment = async () => {
    const id = generateTrackingId();
    const cost = formValues.weight * 60; // $60 per kg
    const newShipment = {
      id,
      carrier: 'SwiftTrack Express',
      sender: formValues.sender,
      recipient: formValues.recipient,
      origin: formValues.origin,
      destination: formValues.destination,
      weight: formValues.weight,
      description: formValues.description,
      cost,
      status: 'created',
      currentLocation: formValues.origin,
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      events: [{ date: new Date().toISOString().split('T')[0], description: 'Shipment created' }]
    };

    try {
      await window.firebaseDB.addDoc(window.firebaseDB.shipmentsCollection, newShipment);
      setTrackingId(id);
      window.location.hash = `/receipt/${id}`;
    } catch (error) {
      console.error("Error creating shipment:", error);
      alert("Failed to create shipment: " + error.message);
    }
  };

  const updateShipmentStatus = async (key, value) => {
    const shipmentRef = window.firebaseDB.doc(window.firebaseDB.shipmentsCollection, trackingId);
    await window.firebaseDB.updateDoc(shipmentRef, { [key]: value });
  };

  const renderLogo = () => (
    <svg width="40" height="40" viewBox="0 0 100 100" fill="#003366">
      <rect x="10" y="20" width="80" height="60" rx="5" stroke="#003366" strokeWidth="5" fill="none" />
      <circle cx="30" cy="50" r="8" fill="#FF9900" />
      <path d="M30 60 L70 60 M70 40 L70 60" stroke="#003366" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );

  const renderHeader = () => (
    <header style={{
      padding: '20px',
      backgroundColor: '#f8f9fa',
      textAlign: 'center'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '10px'
      }}>
        {renderLogo()}
        <h1 style={{ margin: 0, fontSize: '2rem', color: '#003366' }}>Swift Track Express</h1>
      </div>
      <p style={{ color: '#666', marginTop: '5px' }}>Professional Nodery</p>
    </header>
  );

  const renderHome = () => {
    const [searchInput, setSearchInput] = useState('');

    const handleSearch = () => {
      if (searchInput.trim()) {
        window.location.hash = `/track/${searchInput.trim()}`;
      }
    };

    return (
      <div style={{
        maxWidth: '600px',
        margin: 'auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Track Your Shipment</h2>

        {/* Tracking Number Input */}
        <div style={{
          marginBottom: '30px'
        }}>
          <input
            type="text"
            placeholder="Enter tracking number"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              padding: '12px',
              width: '80%',
              borderRadius: '6px',
              border: '1px solid #ccc',
              fontSize: '1rem',
              marginRight: '10px'
            }}
          />
          <button
            onClick={handleSearch}
            style={{
              padding: '12px 20px',
              backgroundColor: '#003366',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Track
          </button>
        </div>

        {/* Create New Shipment */}
        <div style={{
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '10px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '15px' }}>Create New Shipment</h2>
          <form onSubmit={(e) => { e.preventDefault(); handleCreateShipment(); }} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '15px',
            textAlign: 'left'
          }}>
            <div><label>Sender</label><br/><input name="sender" value={formValues.sender} onChange={handleInputChange} style={inputStyle} /></div>
            <div><label>Recipient</label><br/><input name="recipient" value={formValues.recipient} onChange={handleInputChange} style={inputStyle} /></div>
            <div><label>Origin</label><br/><input name="origin" value={formValues.origin} onChange={handleInputChange} style={inputStyle} /></div>
            <div><label>Destination</label><br/><input name="destination" value={formValues.destination} onChange={handleInputChange} style={inputStyle} /></div>
            <div><label>Weight (kg)</label><br/><input name="weight" type="number" value={formValues.weight} onChange={handleInputChange} style={inputStyle} /></div>
            <div><label>Description</label><br/><input name="description" value={formValues.description} onChange={handleInputChange} style={inputStyle} /></div>
          </form>

          <div style={{ marginBottom: '15px', fontWeight: 'bold', textAlign: 'right' }}>
            Cost: ${formValues.weight ? (formValues.weight * 60).toFixed(2) : 0}
          </div>

          <button
            onClick={handleCreateShipment}
            disabled={!formValues.weight || !formValues.sender || !formValues.recipient}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: formValues.weight && formValues.sender && formValues.recipient ? '#FF9900' : '#ccc',
              color: '#fff',
              fontWeight: 'bold',
              border: 'none',
              borderRadius: '6px',
              cursor: formValues.weight && formValues.sender && formValues.recipient ? 'pointer' : 'not-allowed'
            }}
          >
            Proceed to Payment
          </button>
        </div>
      </div>
    );
  };

  const renderReceipt = () => {
    const data = shipments[trackingId];
    if (!data) return null;

    return (
      <div style={{
        maxWidth: '500px',
        margin: 'auto',
        padding: '30px',
        textAlign: 'center',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '30px'
      }}>
        <h2 style={{ color: '#28a745' }}>Payment Successful!</h2>
        <p><strong>Tracking ID:</strong> {trackingId}</p>
        <p><strong>Transaction ID:</strong> TXN{Math.floor(10000000 + Math.random() * 90000000)}</p>
        <p><strong>Total:</strong> ${data.cost}</p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
          <a href={`#track/${trackingId}`} style={linkButtonStyle}>View Public Tracking</a>
          <a href={`#dashboard/${trackingId}`} style={linkButtonStyle}>Access Dashboard</a>
        </div>
      </div>
    );
  };

  const renderDashboard = () => {
    const data = shipments[trackingId];
    if (!data) return <p>Invalid tracking ID</p>;

    const handleUpdate = (key, value) => {
      const shipmentRef = window.firebaseDB.doc(window.firebaseDB.shipmentsCollection, trackingId);
      window.firebaseDB.updateDoc(shipmentRef, { [key]: value });
    };

    const addEvent = () => {
      const newEvent = [...data.events, {
        date: new Date().toISOString().split('T')[0],
        description: 'Custom event added'
      }];
      handleUpdate('events', newEvent);
    };

    return (
      <div style={{
        maxWidth: '600px',
        margin: 'auto',
        padding: '20px',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '30px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Manage Shipment {trackingId}</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px'
        }}>
          <div>
            <label>Status</label>
            <select value={data.status} onChange={(e) => handleUpdate('status', e.target.value)} style={inputStyle}>
              <option value="created">Created</option>
              <option value="in-transit">In Transit</option>
              <option value="delayed">Delayed</option>
              <option value="held">Held at Customs</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
          <div>
            <label>Current Location</label>
            <input value={data.currentLocation} onChange={(e) => handleUpdate('currentLocation', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Estimated Delivery</label>
            <input type="date" value={data.estimatedDelivery} onChange={(e) => handleUpdate('estimatedDelivery', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label>Notes</label>
            <input value={data.notes} onChange={(e) => handleUpdate('notes', e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button onClick={addEvent} style={{
            padding: '10px 15px',
            backgroundColor: '#003366',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Add Custom Event
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>Events</h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {data.events.map((event, index) => (
              <li key={index} style={cardStyle}>{event.date}: {event.description}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderTrack = () => {
    const data = shipments[trackingId];
    if (!data) return <p>Invalid tracking ID</p>;

    return (
      <div style={{
        maxWidth: '600px',
        margin: 'auto',
        padding: '20px',
        background: '#fff',
        borderRadius: '10px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        marginTop: '30px'
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Tracking Shipment {trackingId}</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '15px',
          marginBottom: '20px'
        }}>
          <div style={cardStyle}><strong>Carrier:</strong> {data.carrier}</div>
          <div style={cardStyle}><strong>Status:</strong> {data.status}</div>
          <div style={cardStyle}><strong>Current Location:</strong> {data.currentLocation}</div>
          <div style={cardStyle}><strong>Estimated Delivery:</strong> {data.estimatedDelivery}</div>
        </div>

        <h3>Timeline</h3>
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {data.events.map((event, index) => (
            <li key={index} style={cardStyle}>{event.date}: {event.description}</li>
          ))}
        </ul>
      </div>
    );
  };

  const renderAdmin = () => (
    <div style={{
      maxWidth: '900px',
      margin: 'auto',
      padding: '20px',
      background: '#fff',
      borderRadius: '10px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      marginTop: '30px'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Admin Dashboard</h2>
      <h3 style={{ marginBottom: '10px' }}>All Shipments</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f2f2f2' }}>
            <th style={tableHeaderStyle}>Tracking ID</th>
            <th style={tableHeaderStyle}>Status</th>
            <th style={tableHeaderStyle}>From</th>
            <th style={tableHeaderStyle}>To</th>
            <th style={tableHeaderStyle}>Destination</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(shipments).map(([id, s]) => (
            <tr key={id}>
              <td style={tableCellStyle}>{id}</td>
              <td style={tableCellStyle}>{s.status}</td>
              <td style={tableCellStyle}>{s.origin}</td>
              <td style={tableCellStyle}>{s.destination}</td>
              <td style={tableCellStyle}>{s.destination}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div>
        <h3 style={{ marginBottom: '10px' }}>Revenue Summary</h3>
        <p>Total Shipments: {Object.keys(shipments).length}</p>
        <p>Total Revenue: $
          {Object.values(shipments).reduce((sum, s) => sum + (s.cost || 0), 0).toLocaleString()}
        </p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'home': return renderHome();
      case 'receipt': return renderReceipt();
      case 'dashboard': return renderDashboard();
      case 'track': return renderTrack();
      case 'admin': return renderAdmin();
      default: return renderHome();
    }
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', background: '#f9f9f9', minHeight: '100vh' }}>
      {renderHeader()}
      <main style={{ padding: '20px' }}>{renderContent()}</main>
      <footer style={{ textAlign: 'center', padding: '20px', fontSize: '0.9rem', color: '#888' }}>
        Swift Track Express &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

// Styles
const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #ccc'
};

const linkButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#003366',
  color: 'white',
  textDecoration: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  display: 'inline-block',
  marginTop: '10px'
};

const cardStyle = {
  padding: '10px',
  border: '1px solid #ddd',
  borderRadius: '6px'
};

const tableHeaderStyle = {
  textAlign: 'left',
  padding: '10px',
  borderBottom: '1px solid #ccc'
};

const tableCellStyle = {
  padding: '10px',
  borderBottom: '1px solid #eee'
};

export default App;