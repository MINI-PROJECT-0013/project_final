import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import './CustomerProfile.css';

//const id = localStorage.getItem("userId");

const Navbar = ({ onLogout }) => {
  const navigate = useNavigate(); // Hook for navigation
  const id = localStorage.getItem("userId");

  console.log("Retrieved userId:", id);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    if (onLogout) onLogout(); // Call onLogout function if provided
    navigate("/auth"); // Redirect to login page
  };

  return (
    <nav className="navbar">
      <div className="nav-title">CUSTOMER PROFILE</div>
      <div className="nav-links">
        {/* Back button navigates to the previous page */}
        <button onClick={() => navigate(-1)} className="nav-home">
          back
        </button>
        {/* Logout button removes userId and navigates to auth page */}
        <button onClick={handleLogout} className="nav-link">
          logout
        </button>
      </div>
    </nav>
  );
};


const ProfileC = () => {
  const id = localStorage.getItem("userId");
  console.log("Retrieved userId:", id);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    contact: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const [editedProfile, setEditedProfile] = useState({...profile});
  const [message, setMessage] =useState("");
  const [serviceHistory, setServiceHistory] = useState([]);
  const [refreshHistory, setRefreshHistory] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/customer/profile/${id}`);
        console.log("Professional ID:", id);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        const profileData = {
          firstName: data.FirstName || '',
          lastName: data.LastName || '',
          contact: data.phoneNo || '',
          email: data.email || '',
          address: data.address || '',
          city: data.City || '',
          state: data.State || '',
          zipCode: data.ZipCode || '',
        };
        setProfile(profileData);
        setEditedProfile(profileData);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    const fetchServiceHistory = async () => {
      setIsLoading(true);
      try {
          // Get userId from localStorage
          //const userId = localStorage.getItem("userId");
          if (!id) {
              console.error("User ID is missing.");
              return;
          }
  
          // Fetch service history for the logged-in user
          const bookingsResponse = await fetch(`http://localhost:5000/admin/service-history-customer/${id}`);
  
          // Handle HTTP errors and check for valid JSON response
          if (!bookingsResponse.ok) {
              const contentType = bookingsResponse.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                  const errorData = await bookingsResponse.json();
                  console.error("Server error:", errorData.message);
                  throw new Error(`Error ${bookingsResponse.status}: ${errorData.message}`);
              } else {
                  throw new Error(`Error ${bookingsResponse.status}: Server returned an invalid response`);
              }
          }
  
          let bookingsData;
          try {
              bookingsData = await bookingsResponse.json();
          } catch (jsonError) {
              console.error("Invalid JSON response from server:", jsonError);
              throw new Error("Failed to parse server response");
          }
  
          // Ensure bookingsData is an array
          if (!Array.isArray(bookingsData)) {
              console.error("Unexpected response format:", bookingsData);
              throw new Error("Unexpected response format from server");
          }
          // Process the bookings to include customer/professional details
          const enhancedBookings = await Promise.all(
              bookingsData.map(async (booking) => {
                  try {
                      let professionalDetails = {};
                      let customerDetails = {};
                      console.log("Fetching professional for ID:", booking.professional);
                      // Fetch professional details only if necessary
                      if (booking.professional && typeof booking.professional === "string") {
                          try {
                              const profResponse = await fetch(`http://localhost:5000/professional/profile/${booking.professional}`);
                              if (profResponse.ok) {
                                  const profData = await profResponse.json();
                                  console.log("Fetched Professional Data:", profData);
                                  professionalDetails = {
                                      professionalName: profData.name,
                                      professionalContact: profData.contact || "Not available",
                                      professionalEmail: profData.email || "Not available",
                                      professionalProfession: profData.profession || "Not specified",
                                      professionalLocation: profData.address
                                          ? `${profData.address}${profData.City ? ", " + profData.City : ""}${profData.State ? ", " + profData.State : ""}`
                                          : "Location not available",
                                  };
                              }
                          } catch (profError) {
                              console.error("Error fetching professional details:", profError);
                          }
                      } else if (booking.professional && typeof booking.professional === "object") {
                          // If professional is already populated
                          professionalDetails = {
                              professionalName: booking.professional.name,
                              professionalContact: booking.professional.contact || "Not available",
                              professionalEmail: booking.professional.email || "Not available",
                              professionalProfession: booking.professional.profession || "Not specified",
                              professionalLocation: booking.professional.location || "Location not available",
                          };
                      }
  
                      // Fetch customer details only if necessary
                      if (booking.customer && typeof booking.customer === "string") {
                          try {
                              const custResponse = await fetch(`http://localhost:5000/customer/profile/${booking.customer}`);
                              if (custResponse.ok) {
                                  const custData = await custResponse.json();
                                  console.log("Customer Data Fetched:", custData);
                                  customerDetails = {
                                      customerName: `${custData.firstName} ${custData.lastName}`,
                                      customerContact: custData.phoneNo || "Not available",
                                      customerEmail: custData.email || "Not available",
                                  };
                              }
                          } catch (custError) {
                              console.error("Error fetching customer details:", custError);
                          }
                      } else if (booking.customer && typeof booking.customer === "object") {
                          // If customer is already populated
                          customerDetails = {
                              customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
                              customerContact: booking.customer.phoneNo || "Not available",
                              customerEmail: booking.customer.email || "Not available",
                          };
                      }
  
                      // Return the enhanced booking object
                      return {
                          ...booking,
                          ...professionalDetails,
                          ...customerDetails,
                      };
                  } catch (error) {
                      console.error("Error processing booking:", error);
                      return booking;
                  }
              })
          );
  
          setServiceHistory(enhancedBookings);
      } catch (error) {
          console.error("Error fetching service history:", error);
          setServiceHistory([]);
      } finally {
          setIsLoading(false);
      }
  };
  
  
    fetchProfile();
    fetchServiceHistory();
  }, [id, refreshHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`http://localhost:5000/customer/profile/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          FirstName: editedProfile.firstName,
          LastName: editedProfile.lastName,
          phoneNo: editedProfile.contact,
          email: editedProfile.email,
          address: editedProfile.address,
          City: editedProfile.city,
          State: editedProfile.state,
          ZipCode: editedProfile.zipCode,
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setTimeout(() => window.location.reload(), 1000);
        setMessage("Profile updated successfully!");
      } else {
        setMessage(result.message || "Failed to update profile");
      }
     
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleCancel = () => {
    setEditedProfile({...profile});
    setIsEditing(false);
  };

  // Format date for better display
  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/booking/update-status/${bookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus
        }),
      });
      
      if (response.ok) {
        // Refresh the service history
        setRefreshHistory(prev => !prev);
        alert(`Booking ${newStatus} successfully!`);
      } else {
        alert('Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Error updating booking status');
    }
  };

  // Ensure full name is correctly displayed even if data is loading or incomplete
  const fullName = profile.firstName && profile.lastName 
    ? `${profile.firstName} ${profile.lastName}`
    : profile.firstName || profile.lastName || 'Loading...';

  return (
    <div>
      <Navbar />
      <div className="main-content">
        <div className="sidebar">
          <div className="profile-header">
            <h2>{fullName}</h2>
            <p className="user-emailc">{profile.email || 'No email available'}</p>
          </div>
          
          <div className="dashboard-menu">
            <button 
              className={`menu-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account Details
            </button>
            <button 
              className={`menu-item ${activeTab === 'services' ? 'active' : ''}`}
              onClick={() => setActiveTab('services')}
            >
              Service History
            </button>
          </div>
        </div>

        <div className="content">
          <div className="scrollable-contentC">
            {activeTab === 'account' ? (
              <div className="user-details-section">
                <div className="section-header">
                  <h3>Account Details</h3>
                  {!isEditing && (
                    <button className="edit-button" onClick={handleEdit}>
                      Edit
                    </button>
                  )}
                </div>
                
                {isEditing ? (
                  // Edit mode
                  <div className="edit-form">
                    <div className="form-group">
                      <label>First Name:</label>
                      <input 
                        type="text" 
                        name="firstName" 
                        value={editedProfile.firstName} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Last Name:</label>
                      <input 
                        type="text" 
                        name="lastName" 
                        value={editedProfile.lastName} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Email:</label>
                      <input 
                        type="email" 
                        name="email" 
                        value={editedProfile.email} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone Number:</label>
                      <input 
                        type="text" 
                        name="contact" 
                        value={editedProfile.contact} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Address:</label>
                      <input 
                        type="text" 
                        name="address" 
                        value={editedProfile.address} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>City:</label>
                      <input 
                        type="text" 
                        name="city" 
                        value={editedProfile.city} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>State:</label>
                      <input 
                        type="text" 
                        name="state" 
                        value={editedProfile.state} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Zip Code:</label>
                      <input 
                        type="text" 
                        name="zipCode" 
                        value={editedProfile.zipCode} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-actions">
                      <button className="save-button" onClick={handleSave}>Save</button>
                      <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                      {message && <p style={{ color: "green" }}>{message}</p>}
                    </div>
                  </div>
                ) : (
                  // View mode
                  <>
                    <div className="detail-row">
                      <span className="detail-label">Full Name:</span>
                      <span className="detail-value">{fullName}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{profile.email || 'Not provided'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Phone Number:</span>
                      <span className="detail-value">{profile.contact || 'Not provided'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Address: </span>
                      <span className="detail-value">{profile.address || 'Not provided'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">City: </span>
                      <span className="detail-value">{profile.city || 'Not provided'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">State:</span>
                      <span className="detail-value">{profile.state || 'Not provided'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Zip Code:</span>
                      <span className="detail-value">{profile.zipCode || 'Not provided'}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="service-history-section">
                <div className="section-header">
                  <h3>Service History</h3>
                  <button 
                    className="edit-button"
                    onClick={() => setRefreshHistory(prev => !prev)}
                  >
                    Refresh
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="loading-indicator">
                    <p>Loading service history...</p>
                  </div>
                ) : serviceHistory.length > 0 ? (
                  <div className="service-history-list">
                    {serviceHistory.map((booking, index) => (
                      <div key={booking._id || index} className="service-card">
                        <div className="service-header">
                          <h4>{booking.serviceType || booking.service || 'Unknown Service'}</h4>
                          <span className="booking-date">{formatDate(booking.bookingDate || booking.date)}</span>
                        </div>
                        <div className="service-details">
                          <div className="professional-info">
                            <div className="detail-item">
                              <span className="detail-label">Professional:</span>
                              <span className="detail-value">{booking.professionalName || 'Not assigned'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Profession:</span>
                              <span className="detail-value">{booking.professionalProfession || 'Not specified'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Email:</span>
                              <span className="detail-value">{booking.professionalEmail || 'Not available'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Phone:</span>
                              <span className="detail-value">{booking.professionalContact || 'Not available'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Location:</span>
                              <span className="detail-value">{booking.professionalLocation || 'Location not available'}</span>
                            </div>
                            {/* <div className="detail-item">
                              <span className="detail-label">Status:</span>
                              <span className={`detail-value status-${(booking.status || 'pending').toLowerCase()}`}>
                                {booking.status || 'Pending'}
                              </span>
                            </div> */}
                            
                            {booking.notes && (
                              <div className="detail-item">
                                <span className="detail-label">Notes:</span>
                                <span className="detail-value notes">{booking.notes}</span>
                              </div>
                            )}
                            
                            {/* Add actions if the booking is pending */}
                            {booking.status === 'Pending' && (
                              <div className="booking-actions">
                                <button 
                                  className="cancel-button"
                                  onClick={() => updateBookingStatus(booking._id, 'Cancelled')}
                                >
                                  Cancel Booking
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <p>No service history found.</p>
                    <p>Once you book services, they will appear here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileC;