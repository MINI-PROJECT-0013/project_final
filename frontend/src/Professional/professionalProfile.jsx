import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import './professionalProfile.css';

const Navbar = () => {
  const navigate = useNavigate(); // Hook for navigation

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("userId"); // Remove userId
    localStorage.removeItem("token");  // Remove token
    navigate("/"); 
  };

  return (
    <nav className="navbar">
      <div className="nav-title">PROFESSIONAL PROFILE</div>
      <div className="nav-links">
        <button onClick={handleLogout} className="nav-linkp">
          Logout
        </button>
      </div>
    </nav>
  );
};

const Profile = () => {
  const id = localStorage.getItem("userId");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    phoneNo: '',
    email: '',
    location: '',
    profession: '',
    document: '',
    profilePhoto: '',
    rating: 0,
    ratings: [],
    comments: []
  });

  const [editedProfile, setEditedProfile] = useState({...profile});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [serviceHistory, setServiceHistory] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {

    const fetchProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/professional/profile/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch profile data');
        }
        const data = await response.json();
        const profileData = {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNo: data.phoneNo || '',
          email: data.email || '',
          location: data.location || '',
          profession: data.profession || '',
          document: data.document || '',
          profilePhoto: data.profilePhoto || '',
          rating: data.rating || 0,
          ratings: data.ratings || [],
          comments: data.comments || []
        };
        setProfile(profileData);
        setEditedProfile(profileData);
        if (data.profilePhoto) {
          setPreviewUrl(data.profilePhoto);
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };

    const fetchServiceHistory = async () => {
      try {
        console.log("Professional ID:", id); 
        // Fetch bookings data for this professional
        const bookingsResponse = await fetch(`http://localhost:5000/admin/service-history/${id}`);
        if (!bookingsResponse.ok) {
          throw new Error('Failed to fetch bookings data');
        }
        const bookingsData = await bookingsResponse.json();
        
        // For each booking, fetch the customer details
        const enhancedBookings = await Promise.all(bookingsData.map(async (booking) => {
          try {
            // Fetch customer details by ID
            const custResponse = await fetch(`http://localhost:5000/customer/profile/${booking.customerId}`);
            if (custResponse.ok) {
              const custData = await custResponse.json();
              return {
                ...booking,
                customerName: `${custData.FirstName} ${custData.LastName}`,
                customerContact: custData.phoneNo || 'Not available',
                customerEmail: custData.email || 'Not available',
                customerLocation: custData.location || 'Not available',
                serviceDate: booking.serviceDate || booking.bookingDate || 'Not available',
                serviceTime: booking.serviceTime || 'Not specified',
                serviceStatus: booking.status || 'Pending',
                paymentStatus: booking.paymentStatus || 'Not specified',
                serviceDescription: booking.description || 'No description provided'
              };
            } else {
              // If customer data fetch fails, use whatever data is in the booking
              return {
                ...booking,
                customerName: booking.customerName || 'Unknown',
                customerContact: booking.customerContact || 'Not available',
                customerEmail: booking.customerEmail || 'Not available',
                customerLocation: booking.customerLocation || 'Not available'
              };
            }
          } catch (error) {
            console.error('Error fetching customer data:', error);
            return booking;
          }
        }));
        
        setServiceHistory(enhancedBookings);
      } catch (error) {
        console.error('Error fetching service history:', error);
        setServiceHistory([]);
      }
    };

    fetchProfile();
    fetchServiceHistory();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile({
      ...editedProfile,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Create a FormData object to handle file upload
      const formData = new FormData();
      formData.append('firstName', editedProfile.firstName);
      formData.append('lastName', editedProfile.lastName);
      formData.append('phoneNo', editedProfile.phoneNo);
      formData.append('email', editedProfile.email);
      formData.append('location', editedProfile.location);
      formData.append('profession', editedProfile.profession);
      
      // Only append the file if a new one was selected
      if (selectedFile) {
        formData.append('profilePhoto', selectedFile);
      }
      
      const response = await fetch(`http://localhost:5000/professional/profile/${id}`, {
        method: 'PUT',
        body: formData,
        // Do not set Content-Type header, it will be set automatically with boundary for FormData
      });
      
      if (response.ok) {
        const updatedData = await response.json();
        setProfile({
          ...editedProfile,
          ...updatedData,
          profilePhoto: updatedData.profilePhoto || editedProfile.profilePhoto
        });
        setIsEditing(false);
        setSelectedFile(null);
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleCancel = () => {
    setEditedProfile({...profile});
    setPreviewUrl(profile.profilePhoto || '');
    setSelectedFile(null);
    setIsEditing(false);
  };

  // Modified function to handle direct photo click
  const handleProfilePhotoClick = () => {
    if (!isEditing) {
      setIsEditing(true);
      // Give a little time for the edit mode to activate, then trigger file input
      setTimeout(() => {
        triggerFileInput();
      }, 100);
    } else {
      triggerFileInput();
    }
  };
  console.log(profile.comments); // Log the comments to check if data is coming through
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
          <img 
            src={previewUrl || "https://placehold.co/150"} 
            alt="Profile" 
            className="profile-image"
            onClick={handleProfilePhotoClick} 
            style={{ cursor: 'pointer' }}
            title="Click to change profile photo"
          />

            
            <div className="photo-upload-controls">
              <input 
                type="file" 
                ref={fileInputRef}
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            
            <h2 className="name-pro">{fullName}</h2>
            <p className="user-emailp">{profile.email || 'No email available'}</p>
          </div>
          
          <div className="dashboard-menu">
            <button 
              className={`menu-item ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account Details
            </button>
            <button 
              className={`menu-item ${activeTab === 'ratings' ? 'active' : ''}`}
              onClick={() => setActiveTab('ratings')}
            >
              Ratings
            </button>
            <button 
              className={`menu-item ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews
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
          <div className="scrollable-content">
            {activeTab === 'account' && (
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
                        name="phoneNo" 
                        value={editedProfile.phoneNo} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Work Location:</label>
                      <input 
                        type="text" 
                        name="location" 
                        value={editedProfile.location} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-group">
                      <label>Profession:</label>
                      <input 
                        type="text" 
                        name="profession" 
                        value={editedProfile.profession} 
                        onChange={handleInputChange} 
                      />
                    </div>

                    <div className="form-actions">
                      <button className="save-button" onClick={handleSave}>Save</button>
                      <button className="cancel-button" onClick={handleCancel}>Cancel</button>
                      {/* {message && <p style={{ color: "green" }}>{message}</p>} */}
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
                      <span className="detail-value">{profile.phoneNo || 'Not provided'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Work Location:</span>
                      <span className="detail-value">{profile.location || 'Not provided'}</span>
                    </div>

                    <div className="detail-row">
                      <span className="detail-label">Profession:</span>
                      <span className="detail-value">{profile.profession || 'Not provided'}</span>
                    </div>

                    <div className="attachments-section">
                      <h4>Documents</h4>
                      {profile.document ? (
                        <div className="attachments-list">
                          <a
                            href={profile.document}
                            target="_blank" rel="noopener noreferrer" 
                            className="download-button">
                            View Document
                          </a>
                        </div>
                      ) : (
                        <p className="no-files">No documents attached</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'ratings' && (
              <div className="ratings-section">
                <h3>Customer Ratings</h3>
                <div className="average-rating-display">
                  <h4>Average Rating: {profile.rating ? profile.rating.toFixed(1) : "N/A"}</h4>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span
                        key={star}
                        className={`star ${Math.round(profile.rating || 0) >= star ? "selected" : ""}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <p>Total ratings: {profile.ratings?.length || 0}</p>
                </div>
                
                {profile.ratings && profile.ratings.length > 0 ? (
                  <div className="ratings-list">
                    {profile.ratings.map((rating, index) => (
                      <div key={index} className="rating-card">
                        <div className="rating-header">
                          <span className="customer-name">{rating.customerName || "Anonymous"}</span>
                          <div className="star-rating">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span 
                                key={star} 
                                className={`star ${rating.rating >= star ? "selected" : ""}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Rating:</span>
                          <span className="detail-value">{rating.rating} / 5</span>
                        </div>
                        <span className="rating-date">
                          Rated on: {new Date(rating.date).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-ratings">No ratings received yet</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="reviews-section">
                <h3>Customer Reviews</h3>
                {profile.comments && profile.comments.length > 0 ? (
                  <div className="reviews-list">
                    {profile.comments.map((comment, index) => (
                      <div key={index} className="review-card">
                        <div className="review-header">
                          <span className="customer-name">
                            {comment.username ? comment.username : "Anonymous"}  {/* Show the userId if available */}
                          </span>
                        </div>
                        <p className="review-text">
                          {comment.comment || "No comment provided"}  {/* Display the comment */}
                        </p>
                        <span className="review-date">
                          {comment.date ? new Date(comment.date).toLocaleDateString() : 'Date not available'}  {/* Use the date field */}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-reviews">No reviews received yet</p>
                )}
              </div>
            )}


            {activeTab === 'services' && (
              <div className="service-history-section">
                <h3>Service History</h3>
                {serviceHistory.length > 0 ? (
                  <div className="service-history-listp">
                    {serviceHistory.map((booking, index) => (
                      <div key={booking.id || booking._id || index} className="service-cardp">
                        {<div className="service-header">
                          {/* <h4>{booking.serviceType || 'Unknown Service'}</h4>
                          <span className={`service-status ${booking.serviceStatus?.toLowerCase()}`}>
                            {booking.serviceStatus || 'Pending'}
                          </span> */}
                        </div>}
                        
                        <div className="service-dates">
                          <div className="service-date">
                            <span className="date-label">Service Date:</span>
                            <span className="date-value">{booking.serviceDate}</span>
                          </div>
                          {booking.serviceTime && (
                            <div className="service-time">
                              <span className="time-label">Time:</span>
                              <span className="time-value">{booking.serviceTime}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="service-details">
                          <div className="customer-info">
                            <h5>Customer Information</h5>
                            <div className="detail-item">
                              <span className="detail-label">Name:</span>
                              <span className="detail-value">{booking.customerName || 'Unknown'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Phone:</span>
                              <span className="detail-value">{booking.customerContact || 'Not available'}</span>
                            </div>
                            <div className="detail-item">
                              <span className="detail-label">Email:</span>
                              <span className="detail-value">{booking.customerEmail || 'Not available'}</span>
                            </div>
                            {/* <div className="detail-item">
                              <span className="detail-label">Location:</span>
                              <span className="detail-value">{booking.customerLocation || 'Not available'}</span>
                            </div> */}
                          </div>
                          
                         {/*  <div className="service-description">
                            <h5>Service Details</h5>
                            <p>{booking.serviceDescription}</p>
                          </div> */}
                          
                          {/*{booking.paymentStatus && (
                            <div className="payment-info">
                              <span className="payment-label">Payment Status:</span>
                              <span className={`payment-status ${booking.paymentStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                                {booking.paymentStatus}
                              </span>
                            </div>
                          )}*/}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-history">
                    <p>No service history found.</p>
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

export default Profile;