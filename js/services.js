/**
 * DrivePinas — Backend Services
 * Centralizes all Cloudinary and Supabase communication.
 * Fallbacks to localStorage if credentials are not configured.
 */

// --- API Configuration ---
// TO CONFIGURE: Replace these values with your actual Cloudinary & Supabase credentials.
var CLOUDINARY_CLOUD_NAME = "your-cloud-name";
var CLOUDINARY_UPLOAD_PRESET = "your-unsigned-preset";
var SUPABASE_URL = "https://your-project.supabase.co";
var SUPABASE_ANON_KEY = "your-supabase-anon-key";

/**
 * Checks if the API credentials have been properly configured by the user.
 * @returns {boolean} True if configured, false if using default placeholders.
 */
function isBackendConfigured() {
  return (
    CLOUDINARY_CLOUD_NAME !== "your-cloud-name" &&
    CLOUDINARY_UPLOAD_PRESET !== "your-unsigned-preset" &&
    SUPABASE_URL !== "https://your-project.supabase.co" &&
    SUPABASE_ANON_KEY !== "your-supabase-anon-key"
  );
}

/**
 * Uploads a compressed image blob to Cloudinary.
 * Falls back to generating a local Object URL if backend is unconfigured.
 * @param {Blob} blob - Compressed image blob.
 * @returns {Promise<string>} Secure public URL of the uploaded image.
 */
function uploadPhotoToCloudinary(blob) {
  return new Promise(function (resolve, reject) {
    if (!isBackendConfigured()) {
      console.warn("Cloudinary not configured. Falling back to local object URL.");
      // Fallback: Use Object URL for local/offline testing
      setTimeout(function () {
        resolve(URL.createObjectURL(blob));
      }, 500);
      return;
    }

    var formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "drivepinas/sell-submissions");

    var url = "https://api.cloudinary.com/v1_1/" + CLOUDINARY_CLOUD_NAME + "/image/upload";

    fetch(url, {
      method: "POST",
      body: formData
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Cloudinary upload failed with status: " + response.status);
        }
        return response.json();
      })
      .then(function (data) {
        if (data.secure_url) {
          resolve(data.secure_url);
        } else {
          throw new Error("Cloudinary response did not contain secure_url");
        }
      })
      .catch(function (error) {
        console.error("Error uploading to Cloudinary:", error);
        reject(error);
      });
  });
}

/**
 * Saves a sell submission record to Supabase.
 * Falls back to storing in localStorage under 'dp_admin_data' if backend is unconfigured.
 * @param {Object} data - Full form data including photo_urls array.
 * @returns {Promise<void>}
 */
function saveSellSubmission(data) {
  return new Promise(function (resolve, reject) {
    if (!isBackendConfigured()) {
      console.warn("Supabase not configured. Falling back to localStorage.");
      
      setTimeout(function () {
        try {
          var stored = localStorage.getItem("dp_admin_data");
          var adminDb = { brands: [], messages: [], notifications: [], acquisitions: [], nextCarId: 100, nextNotificationId: 10 };
          if (stored) {
            adminDb = JSON.parse(stored);
          }
          
          if (!adminDb.acquisitions) adminDb.acquisitions = [];
          if (!adminDb.notifications) adminDb.notifications = [];
          if (!adminDb.nextNotificationId) adminDb.nextNotificationId = 10;

          var newAcq = {
            id: Math.floor(Math.random() * 90000) + 10000,
            brandSlug: data.brand,
            brandName: data.brand.charAt(0).toUpperCase() + data.brand.slice(1),
            name: data.model + (data.variant ? " " + data.variant : ""),
            year: data.year,
            price: data.asking_price,
            odometer: data.odometer || "N/A",
            transmission: data.transmission,
            fuel: data.fuel_type,
            body: data.body_type,
            contactLink: data.seller_email,
            condition: data.condition,
            registrationStatus: data.registration_status,
            knownIssues: data.known_issues || "None",
            description: data.description || "No description.",
            photoUrls: data.photo_urls || [],
            sellerName: data.seller_name,
            sellerPhone: data.seller_phone || "N/A",
            status: "pending",
            time: new Date().toISOString()
          };

          adminDb.acquisitions.unshift(newAcq);

          adminDb.notifications.unshift({
            id: adminDb.nextNotificationId++,
            type: "acquisition",
            title: "New Sell Request: " + newAcq.brandName + " " + newAcq.name,
            message: "Price: \u20b1" + newAcq.price.toLocaleString() + " | Seller: " + data.seller_name,
            time: new Date().toISOString(),
            read: false
          });

          localStorage.setItem("dp_admin_data", JSON.stringify(adminDb));
          resolve();
        } catch (err) {
          reject(err);
        }
      }, 800);
      return;
    }

    // Real Supabase insert using the initialized client
    var supabaseClient = getSupabaseClient();
    supabaseClient
      .from("sell_submissions")
      .insert([data])
      .then(function (response) {
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        // Also dispatch a notification locally so it is visible in the admin UI
        try {
          var stored = localStorage.getItem("dp_admin_data");
          var adminDb = { notifications: [], nextNotificationId: 10 };
          if (stored) adminDb = JSON.parse(stored);
          if (!adminDb.notifications) adminDb.notifications = [];
          if (!adminDb.nextNotificationId) adminDb.nextNotificationId = 10;
          
          adminDb.notifications.unshift({
            id: adminDb.nextNotificationId++,
            type: "acquisition",
            title: "New Submission: " + data.brand + " " + data.model,
            message: "Asking: \u20b1" + data.asking_price.toLocaleString(),
            time: new Date().toISOString(),
            read: false
          });
          localStorage.setItem("dp_admin_data", JSON.stringify(adminDb));
        } catch (e) {
          console.error("Local notification sync failed", e);
        }

        resolve();
      })
      .catch(function (error) {
        console.error("Error saving submission to Supabase:", error);
        reject(error);
      });
  });
}

/**
 * Gets or initializes the Supabase client instance.
 * @returns {Object} Supabase client.
 */
function getSupabaseClient() {
  if (!window.supabase) {
    throw new Error("Supabase client SDK is not loaded.");
  }
  if (!window._supabaseInstance) {
    window._supabaseInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return window._supabaseInstance;
}

/**
 * Fetches all sell submissions from Supabase.
 * Falls back to localStorage if backend is unconfigured.
 * @returns {Promise<Array>} Array of submission objects.
 */
function fetchSellSubmissions() {
  return new Promise(function (resolve, reject) {
    if (!isBackendConfigured()) {
      console.warn("Supabase not configured. Fetching submissions from localStorage.");
      try {
        var stored = localStorage.getItem("dp_admin_data");
        var adminDb = stored ? JSON.parse(stored) : {};
        var acquisitions = adminDb.acquisitions || [];
        resolve(acquisitions);
      } catch (err) {
        reject(err);
      }
      return;
    }

    var supabaseClient = getSupabaseClient();
    supabaseClient
      .from("sell_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .then(function (response) {
        if (response.error) {
          throw new Error(response.error.message);
        }
        resolve(response.data);
      })
      .catch(function (error) {
        console.error("Error fetching submissions from Supabase:", error);
        reject(error);
      });
  });
}

/**
 * Updates the status of a sell submission.
 * Handles both Supabase database and local storage fallback.
 * @param {string|number} id - Submission ID or UUID.
 * @param {string} status - "pending" | "reviewed" | "accepted" | "rejected"
 * @returns {Promise<void>}
 */
function updateSubmissionStatus(id, status) {
  return new Promise(function (resolve, reject) {
    // Attempt local storage sync first
    try {
      var stored = localStorage.getItem("dp_admin_data");
      if (stored) {
        var adminDb = JSON.parse(stored);
        if (adminDb.acquisitions) {
          var index = adminDb.acquisitions.findIndex(function (a) {
            return a.id.toString() === id.toString();
          });
          if (index !== -1) {
            adminDb.acquisitions[index].status = status;
            localStorage.setItem("dp_admin_data", JSON.stringify(adminDb));
          }
        }
      }
    } catch (e) {
      console.error("Local storage status sync failed", e);
    }

    if (!isBackendConfigured()) {
      resolve();
      return;
    }

    var supabaseClient = getSupabaseClient();
    supabaseClient
      .from("sell_submissions")
      .update({ status: status })
      .eq("id", id)
      .then(function (response) {
        if (response.error) {
          throw new Error(response.error.message);
        }
        resolve();
      })
      .catch(function (error) {
        console.error("Error updating submission status in Supabase:", error);
        reject(error);
      });
  });
}
