import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform, // Import Platform to handle OS-specific padding
  Modal // Modal is still needed for other purposes, but not for sale editing
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons'; // For the edit icon

// --- File System Constants ---
const LOG_DIRECTORY = FileSystem.documentDirectory + 'inventory_logs/';
const INVENTORY_FILE = FileSystem.documentDirectory + 'inventory.json'; // File for inventory data
const MENUS_FILE = FileSystem.documentDirectory + 'menus.json'; // File for menu structure
const COLOR_SCHEME_FILE = FileSystem.documentDirectory + 'color_scheme.json'; // File for color scheme persistence
const CONFIG_BACKUP_FILE = FileSystem.documentDirectory + 'inventory_config_backup.json'; // File for config import/export

// --- Default Data for Initialization ---
const DEFAULT_ITEM_QUANTITY = 10;
const DEFAULT_ITEM_PRICE = 25.00; // Default price for items
const DEFAULT_MENUS = {
  categories: [
    { name: 'Other', brands: [] }, // Start with 'Other' category
    {
      name: 'Clips, etc.', // Ensure 'Clips, etc.' category is always present and non-deletable
      brands: [
        {
          name: 'Fixed Prices', // Internal brand for fixed prices, non-deletable
          items: [
            // These items are regenerated on loadMenus to ensure consistency
            { name: '$2.00', price: 2.00 },
            { name: '$5.00', price: 5.00 },
            { name: '$10.00', price: 10.00 },
            { name: '$12.00', price: 12.00 },
            { name: '$14.00', price: 14.00 },
            { name: '$18.00', price: 18.00 },
            { name: '$20.00', price: 20.00 },
            { name: '$22.00', price: 22.00 },
            { name: '$25.00', price: 25.00 },
            { name: '$30.00', price: 30.00 },
            { name: '$40.00', price: 40.00 },
            { name: '$50.00', price: 50.00 },
            { name: '$60.00', price: 60.00 },
            { name: '$70.00', price: 70.00 },
            { name: '$80.00', price: 80.00 },
            { name: '$90.00', price: 90.00 },
            { name: '$100.00', price: 100.00 },
            { name: '$110.00', price: 110.00 },
            { name: '$120.00', price: 120.00 },
            { name: '$130.00', price: 130.00 },
            { name: '$140.00', price: 140.00 },
            { name: '$150.00', price: 150.00 },
            { name: '$160.00', price: 160.00 },
            { name: '$170.00', price: 170.00 },
            { name: '$180.00', price: 180.00 },
            { name: '$190.00', price: 190.00 },
            { name: '$200.00', price: 200.00 },
            { name: '$250.00', price: 250.00 },
          ]
        }
      ]
    }
  ]
};
const DEFAULT_COLOR_SCHEME = 'light'; // Default color scheme

// --- Color Palettes ---
const COLOR_PALETTES = {
  light: {
    background: '#f0f2f5',
    text: '#333',
    headerBg: '#4a90e2',
    headerText: '#ffffff',
    buttonBgPrimary: '#50c878', // Green for action buttons
    buttonBgSecondary: '#f5a623', // Orange for log/dev buttons
    buttonBgTertiary: '#8e44ad', // Purple for inventory button
    buttonBgDanger: '#e74c3c', // Red for delete/reset
    buttonBgLight: '#bdc3c7', // Gray for quantity controls
    inputBg: '#ffffff',
    inputBorder: '#ddd',
    logEntryBg: '#ffffff',
    logEntryBorder: '#eee',
    logTimestamp: '#2c3e50',
    logAction: '#555',
    logDetails: '#7f8c8d',
    cardBg: '#ffffff',
    cardBorder: '#eee',
    shadowColor: '#000',
    pickerBg: '#e0e0e0',
    pickerText: '#333',
    pickerSelectedBg: '#4a90e2',
    pickerSelectedText: '#ffffff',
    warningBg: '#fdf6e3',
    warningBorder: '#f7d794',
    warningText: '#d35400',
  },
  dark: {
    background: '#2c3e50', // Dark background
    text: '#ecf0f1', // Light text
    headerBg: '#34495e', // Darker blue
    headerText: '#ffffff',
    buttonBgPrimary: '#27ae60', // Darker green
    buttonBgSecondary: '#e67e22', // Darker orange
    buttonBgTertiary: '#9b59b6', // Darker purple
    buttonBgDanger: '#c0392b', // Darker red
    buttonBgLight: '#7f8c8d', // Darker gray for quantity controls
    inputBg: '#34495e',
    inputBorder: '#555',
    logEntryBg: '#34495e',
    logEntryBorder: '#555',
    logTimestamp: '#ecf0f1',
    logAction: '#bdc3c7',
    logDetails: '#95a5a6',
    cardBg: '#34495e',
    cardBorder: '#555',
    shadowColor: '#000', // Shadow can remain black or be a very dark gray
    pickerBg: '#555',
    pickerText: '#ecf0f1',
    pickerSelectedBg: '#4a90e2', // Keep blue for selection
    pickerSelectedText: '#ffffff',
    warningBg: '#442b00', // Darker warning
    warningBorder: '#7a5200',
    warningText: '#ffcc80',
  }
};

// Helper function to get colors based on current scheme
const getColors = (scheme) => COLOR_PALETTES[scheme];


// --- Helper Functions ---

// Creates a unique internal key for inventory items (e.g., "Purses_Brand A_Item A1")
const getItemKey = (category, brand, item) => `${category}_${brand}_${item}`;

// Parses item key back for display/CSV
const parseItemKey = (itemKey) => {
  const parts = itemKey.split('_');
  if (parts.length >= 3) {
    const category = parts[0];
    const brand = parts[1];
    const item = parts.slice(2).join('_'); // Rejoin in case item name had underscores
    return { category, brand, item };
  }
  return { category: 'Unknown', brand: 'Unknown', item: itemKey }; // Fallback
};

// Generates a human-readable, alphanumeric unique code for items
const generateUniqueItemCode = (category, brand, item) => {
  // Clean and truncate parts for the code
  const cleanAndTruncate = (str) => str.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();

  const catPart = cleanAndTruncate(category);
  const brandPart = cleanAndTruncate(brand);
  const itemPart = cleanAndTruncate(item);
  const randomNum = Math.floor(Math.random() * 90000 + 10000).toString(); // 5-digit random number for better uniqueness
  return `${catPart}-${brandPart}-${itemPart}-${randomNum}`;
};

// Gets category-level code for display
const getCategoryCode = (category) => {
  return category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
};

// Gets brand-level code for display (e.g., "PUR-BRA" for Purses-BrandA)
const getBrandCode = (category, brand) => {
  const catPrefix = category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  const brandPrefix = brand.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  return `${catPrefix}-${brandPrefix}`;
};

// --- Example Data for Development Mode ---
const EXAMPLE_MENUS = {
  categories: [
    {
      name: 'Dresses',
      brands: [
        { name: 'Evening', items: [{ name: 'Silk Gown', price: 250.00 }, { name: 'Cocktail Dress', price: 120.00 }] },
        { name: 'Daywear', items: [{ name: 'Floral Sundress', price: 65.00 }, { name: 'Boho Maxi', price: 80.00 }] },
      ],
    },
    {
      name: 'Tops',
      brands: [
        { name: 'Blouses', items: [{ name: 'Lace Blouse', price: 55.00 }, { name: 'Silk Camisole', price: 45.00 }] },
        { name: 'Sweaters', items: [{ name: 'Cashmere Pullover', price: 180.00 }, { name: 'Knit Cardigan', price: 90.00 }] },
      ],
    },
    {
      name: 'Bottoms',
      brands: [
        { name: 'Pants', items: [{ name: 'Tailored Trousers', price: 75.00 }, { name: 'Wide-Leg Pants', price: 85.00 }] },
        { name: 'Skirts', items: [{ name: 'Pencil Skirt', price: 60.00 }, { name: 'Pleated Midi', price: 70.00 }] },
        { name: 'Jeans', items: [{ name: 'High-Rise Skinny', price: 70.00 }, { name: 'Distressed Boyfriend', price: 80.00 }] },
      ],
    },
    {
      name: 'Outerwear',
      brands: [
        { name: 'Jackets', items: [{ name: 'Blazer', price: 130.00 }, { name: 'Denim Jacket', price: 90.00 }] },
        { name: 'Coats', items: [{ name: 'Wool Trench', price: 220.00 }, { name: 'Puffer Coat', price: 160.00 }] },
      ],
    },
    {
      name: 'Accessories',
      brands: [
        { name: 'Jewelry', items: [{ name: 'Delicate Necklace', price: 40.00 }, { name: 'Statement Earrings', price: 35.00 }] },
        { name: 'Handbags', items: [{ name: 'Leather Tote', price: 150.00 }, { name: 'Crossbody Bag', price: 95.00 }] },
        { name: 'Scarves', items: [{ name: 'Silk Scarf', price: 30.00 }, { name: 'Pashmina', price: 50.00 }] },
      ],
    },
  ],
};


// --- Main Application Component ---
const App = () => {
  const [currentView, setCurrentView] = useState('main');
  const [log, setLog] = useState([]); // Stores structured log entries for the current session/display
  const [inventory, setInventory] = useState({}); // Stores inventory quantities and metadata
  const [isLoading, setIsLoading] = useState(true);
  const [cashierNumber, setCashierNumber] = useState('0'); // State for cashier number
  const [menuData, setMenuData] = useState(DEFAULT_MENUS); // Stores hierarchical menu data
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false); // State for edit mode
  const [colorScheme, setColorScheme] = useState(DEFAULT_COLOR_SCHEME); // State for color scheme
  const [lastCompletedSaleTotal, setLastCompletedSaleTotal] = useState(0); // New state for last completed sale total

  // --- File System Functions ---

  // Ensures the log directory exists
  const ensureLogDirectoryExists = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(LOG_DIRECTORY);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(LOG_DIRECTORY, { intermediates: true });
      }
    } catch (e) {
      console.error("Failed to ensure log directory exists:", e);
      Alert.alert("Error", "Failed to prepare log directory.");
    }
  };

  // Gets the file path for today's log (always .csv)
  const getTodayLogFilePath = () => {
    const date = new Date();
    const fileName = `inventory_log_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.csv`;
    return LOG_DIRECTORY + fileName;
  };

  // Loads log entries from today's CSV file, ensuring file exists and parsing structured data
  const loadLogFromFile = async () => {
    await ensureLogDirectoryExists();
    const filePath = getTodayLogFilePath();
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        // Create an empty log file with header if it does not exist for today
        await FileSystem.writeAsStringAsync(filePath, 'Timestamp,Action,Item Code,Category,Brand,Item,Quantity Change,New Quantity,Price Sold,Discount Applied\n'); // Updated header
        setLog([]);
      } else {
        const content = await FileSystem.readAsStringAsync(filePath);
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0 && lines[0].startsWith('Timestamp,Action')) { // Check for header
          lines.shift(); // Remove header line
        }
        const parsedLog = lines.map(line => {
          const parts = line.split(',');
          // Expect at least 10 parts for full log entry with pricing
          if (parts.length >= 10) {
            const timestamp = parts[0];
            const action = parts[1];
            const itemCode = parts[2];
            const category = parts[3];
            const brand = parts[4];
            const item = parts[5];
            const quantityChange = parts[6];
            const newQuantity = parts[7];
            const priceSold = parts[8];
            const discountApplied = parts[9];
            return { timestamp, action, itemCode, category, brand, item, quantityChange, newQuantity, priceSold, discountApplied };
          }
          return { raw: line }; // Fallback for malformed lines
        });
        setLog(parsedLog);
      }
    } catch (e) {
      console.error("Failed to load or create log file:", e);
      Alert.alert("Error", "Failed to load or create log file.");
      setLog([]); // Fallback to empty log on error
    }
  };

  // Saves structured log entries to today's CSV file
  const saveLogToFile = async (currentLog) => {
    await ensureLogDirectoryExists();
    const filePath = getTodayLogFilePath();
    try {
      let csvContent = "Timestamp,Action,Item Code,Category,Brand,Item,Quantity Change,New Quantity,Price Sold,Discount Applied\n"; // CSV Header
      currentLog.forEach(entry => {
        // Skip malformed entries that do not have essential properties
        if (!entry.timestamp || !entry.action || !entry.itemCode || !entry.category || !entry.brand || !entry.item) {
          console.warn("Skipping malformed log entry during save:", entry);
          return; // Skip this entry
        }

        // Ensure values are properly quoted if they contain commas
        const safeCategory = entry.category.includes(',') ? `"${entry.category}"` : entry.category;
        const safeBrand = entry.brand.includes(',') ? `"${entry.brand}"` : entry.brand;
        const safeItem = entry.item.includes(',') ? `"${entry.item}"` : entry.item;

        // Robust price handling: convert to float, then check for NaN, then toFixed
        let priceValue = entry.priceSold;
        if (typeof priceValue === 'string' && priceValue !== 'N/A') {
            priceValue = parseFloat(priceValue);
        }
        const safePriceSold = (typeof priceValue === 'number' && !isNaN(priceValue)) ? priceValue.toFixed(2) : 'N/A';

        const safeDiscountApplied = entry.discountApplied !== undefined ? entry.discountApplied : 'No';

        csvContent += `${entry.timestamp},${entry.action},${entry.itemCode},${safeCategory},${safeBrand},${safeItem},${entry.quantityChange},${entry.newQuantity},${safePriceSold},${safeDiscountApplied}\n`;
      });
      await FileSystem.writeAsStringAsync(filePath, csvContent);
    } catch (e) {
      console.error("Failed to save log file:", e);
      Alert.alert("Error", "Failed to save log file.");
    }
  };

  // Loads inventory data from JSON file, generating defaults if needed
  const loadInventory = async (currentMenuData) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(INVENTORY_FILE);
      let newInventory = {};

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(INVENTORY_FILE);
        newInventory = JSON.parse(content);
      }

      // Generate default inventory for all known items if they are not already loaded
      currentMenuData.categories.forEach(categoryObj => {
        // Only add to inventory if not 'Clips, etc.' or 'Other' category
        if (categoryObj.name !== 'Clips, etc.' && categoryObj.name !== 'Other') {
          if (!newInventory[categoryObj.name]) {
            newInventory[categoryObj.name] = {};
          }
          categoryObj.brands.forEach(brandObj => {
            if (!newInventory[categoryObj.name][brandObj.name]) {
              newInventory[categoryObj.name][brandObj.name] = {};
            }
            brandObj.items.forEach(itemObj => { // Iterate over item objects
              const itemName = itemObj.name; // Get item name
              const itemPrice = itemObj.price !== undefined ? itemObj.price : DEFAULT_ITEM_PRICE; // Get item price or default

                if (newInventory[categoryObj.name]?.[brandObj.name]?.[itemName]) {
                  // If item exists, ensure quantity is a number
                  let existingItem = newInventory[categoryObj.name][brandObj.name][itemName];
                  if (typeof existingItem.quantity !== 'number' || isNaN(existingItem.quantity)) {
                      existingItem.quantity = DEFAULT_ITEM_QUANTITY; // Reset to default if not a valid number
                      existingItem.lastChange = 'Quantity Corrected'; // Log correction
                      existingItem.lastChangeDate = new Date().toLocaleString();
                  }
                  if (existingItem.price === undefined) { // Ensure price is also present
                      existingItem.price = itemPrice;
                  }
                } else {
                  // If item does not exist, initialize it
                  newInventory[categoryObj.name][brandObj.name][itemName] = {
                    itemCode: generateUniqueItemCode(categoryObj.name, brandObj.name, itemName),
                    category: categoryObj.name,
                    brand: brandObj.name,
                    item: itemName,
                    quantity: DEFAULT_ITEM_QUANTITY,
                    price: itemPrice, // Initialize with price
                    lastChange: 'Initial',
                    lastChangeDate: new Date().toLocaleString()
                  };
                }
            });
          });
        }
      });

      // Clean up inventory: remove items/brands/categories that are no longer in menuData
      const cleanedInventory = {};
      currentMenuData.categories.forEach(categoryObj => {
        // Only clean up if category is tracked in inventory (not 'Clips, etc.' or 'Other')
        if (categoryObj.name !== 'Clips, etc.' && categoryObj.name !== 'Other') {
          cleanedInventory[categoryObj.name] = {};
          categoryObj.brands.forEach(brandObj => {
            cleanedInventory[categoryObj.name][brandObj.name] = {};
            brandObj.items.forEach(itemObj => {
              const itemName = itemObj.name;
              if (newInventory[categoryObj.name]?.[brandObj.name]?.[itemName]) {
                cleanedInventory[categoryObj.name][brandObj.name][itemName] = newInventory[categoryObj.name][brandObj.name][itemName];
              }
            });
          });
        }
      });
      // Removed specific handling for 'Other' category custom items as they should not be in inventory at all.

      setInventory(cleanedInventory);
      // Immediately save the potentially updated inventory (with defaults) back to file
      await saveInventory(cleanedInventory);

    } catch (e) {
      console.error("Failed to load inventory:", e);
      Alert.alert("Error", "Failed to load inventory data. Initializing defaults.");
      // Fallback to generating defaults on error
      let defaultInventory = {};
      DEFAULT_MENUS.categories.forEach(categoryObj => {
        if (categoryObj.name !== 'Clips, etc.' && categoryObj.name !== 'Other') { // Do not add 'Clips, etc.' or 'Other' to default inventory
          defaultInventory[categoryObj.name] = {};
          categoryObj.brands.forEach(brandObj => {
            defaultInventory[categoryObj.name][brandObj.name] = {};
            brandObj.items.forEach(itemObj => {
              defaultInventory[categoryObj.name][brandObj.name][itemObj.name] = {
                itemCode: generateUniqueItemCode(categoryObj.name, brandObj.name, itemObj.name),
                category: categoryObj.name,
                brand: brandObj.name,
                item: itemObj.name,
                quantity: DEFAULT_ITEM_QUANTITY,
                price: itemObj.price !== undefined ? itemObj.price : DEFAULT_ITEM_PRICE,
                lastChange: 'Initial',
                lastChangeDate: new Date().toLocaleString()
              };
            });
          });
        }
      });
      setInventory(defaultInventory);
      await saveInventory(defaultInventory);
    }
  };

  // Saves inventory data to JSON file
  const saveInventory = async (currentInventory) => {
    try {
      await FileSystem.writeAsStringAsync(INVENTORY_FILE, JSON.stringify(currentInventory, null, 2));
    } catch (e) {
      console.error("Failed to save inventory:", e);
      Alert.alert("Error", "Failed to save inventory data.");
    }
  };

  // Loads menus (categories, brands, items) from JSON
  const loadMenus = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(MENUS_FILE);
      let loadedMenuData = {};

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(MENUS_FILE);
        loadedMenuData = JSON.parse(content);
      }

      // If no menu data loaded, use defaults
      if (!loadedMenuData || !loadedMenuData.categories || loadedMenuData.categories.length === 0) {
        loadedMenuData = DEFAULT_MENUS;
      }

      // Ensure 'Clips, etc.' category exists and is populated directly with items
      let clipsCategory = loadedMenuData.categories.find(cat => cat.name === 'Clips, etc.');
      if (!clipsCategory) {
        // Create the category and its internal 'Fixed Prices' brand
        clipsCategory = { name: 'Clips, etc.', brands: [{ name: 'Fixed Prices', items: [] }] };
        loadedMenuData.categories.push(clipsCategory);
      }

      // Ensure the 'Fixed Prices' brand exists within 'Clips, etc.' category, or create it
      let fixedPricesBrand = clipsCategory.brands.find(brand => brand.name === 'Fixed Prices');
      if (!fixedPricesBrand) {
          fixedPricesBrand = { name: 'Fixed Prices', items: [] };
          clipsCategory.brands.push(fixedPricesBrand);
      }

      // Updated fixed prices including new values
      const fixedPrices = [
        2, 5, 10, 12, 14, 18, 20, 22, 25, 30,
        40, 50, 60, 70, 80, 90, 100, 110, 120, 130,
        140, 150, 160, 170, 180, 190, 200, 250
      ];
      // Clear existing fixed prices and re-add to ensure consistency
      fixedPricesBrand.items = [];
      fixedPrices.forEach(price => {
        const itemName = `$${price}.00`; // Display name for the button
        // Add to the 'Fixed Prices' brand within 'Clips, etc.'
        fixedPricesBrand.items.push({ name: itemName, price: price });
      });


      setMenuData(loadedMenuData);
      await saveMenus(loadedMenuData); // Save back to ensure defaults are written
      return loadedMenuData; // Return loaded data for use in loadInventory
    } catch (e) {
      console.error("Failed to load menus:", e);
      Alert.alert("Error", "Failed to load menu data. Initializing defaults.");
      setMenuData(DEFAULT_MENUS);
      await saveMenus(DEFAULT_MENUS);
      return DEFAULT_MENUS; // Return default data on error
    }
  };

  // Saves menus (categories, brands, items) to JSON
  const saveMenus = async (currentMenuData) => {
    try {
      await FileSystem.writeAsStringAsync(MENUS_FILE, JSON.stringify(currentMenuData, null, 2));
    } catch (e) {
      console.error("Failed to save menus:", e);
      Alert.alert("Error", "Failed to save menu data.");
    }
  };

  // Loads color scheme from JSON file
  const loadColorScheme = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(COLOR_SCHEME_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(COLOR_SCHEME_FILE);
        const scheme = JSON.parse(content);
        if (COLOR_PALETTES[scheme]) { // Validate loaded scheme
          setColorScheme(scheme);
        } else {
          setColorScheme(DEFAULT_COLOR_SCHEME);
        }
      } else {
        setColorScheme(DEFAULT_COLOR_SCHEME);
        await saveColorScheme(DEFAULT_COLOR_SCHEME); // Save default if file does not exist
      }
    } catch (e) {
      console.error("Failed to load color scheme:", e);
      Alert.alert("Error", "Failed to load color scheme. Using default.");
      setColorScheme(DEFAULT_COLOR_SCHEME); // Fallback to default on error
    }
  };

  // Saves color scheme to JSON file
  const saveColorScheme = async (scheme) => {
    try {
      await FileSystem.writeAsStringAsync(COLOR_SCHEME_FILE, JSON.stringify(scheme));
    } catch (e) {
      console.error("Failed to save color scheme:", e);
      Alert.alert("Error", "Failed to save color scheme.");
    }
  };

  // --- Data Management Functions ---

  // Adds a new structured entry to the log and saves it
  const addToLog = (action, itemCode, category, brand, item, quantityChange, newQuantity, priceSold = 'N/A', discountApplied = 'No') => {
    const timestamp = new Date().toLocaleString();
    const newEntry = {
      timestamp,
      action,
      itemCode,
      category,
      brand,
      item,
      quantityChange,
      newQuantity,
      priceSold: priceSold,
      discountApplied
    };
    setLog(prevLog => {
      const updatedLog = [...prevLog, newEntry];
      saveLogToFile(updatedLog); // Save to file immediately
      return updatedLog;
    });
  };

  // Updates inventory and saves it
  const updateInventory = (category, brand, item, updatedItemData) => {
    // Only update inventory if the category is not 'Clips, etc.' or 'Other'
    if (category === 'Clips, etc.' || category === 'Other') {
      // For these categories, only log the sale, do not track inventory quantity
      return;
    }

    setInventory(prevInventory => {
      const newInventory = { ...prevInventory };
      if (!newInventory[category]) newInventory[category] = {};
      if (!newInventory[category][brand]) newInventory[category][brand] = {};
      newInventory[category][brand][item] = updatedItemData;
      saveInventory(newInventory); // Save to file immediately
      return newInventory;
    });
  };

  // --- Initial Load Effect ---
  useEffect(() => {
    const initializeAppData = async () => {
      await ensureLogDirectoryExists();
      await loadColorScheme(); // Load color scheme first
      const loadedMenuResult = await loadMenus(); // Load menus first and get the result
      await loadInventory(loadedMenuResult); // Pass loaded menus for inventory initialization
      await loadLogFromFile(); // Ensure today's log file is ready
      setIsLoading(false);
    };
    initializeAppData();
  }, []); // Empty dependency array means this runs once on mount

  // --- Navigation Functions ---
  const showMainView = () => setCurrentView('main');
  const showLogView = () => setCurrentView('log');
  const showInventoryView = () => setCurrentView('inventory');
  const showFileManagementView = () => setCurrentView('file_management');
  const showDevelopmentView = () => setCurrentView('development');
  const showMenuManagementView = () => setCurrentView('menu_management'); // Navigation to menu management

  // --- Development Reset Function ---
  const resetAppData = async () => {
    Alert.alert(
      "Reset All Data",
      "Are you sure you want to reset ALL inventory and log data? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          onPress: async () => {
            setIsLoading(true);
            try {
              // Clear states
              setLog([]);
              setInventory({});
              setMenuData(DEFAULT_MENUS); // Reset to default menus
              setCashierNumber('0');
              setColorScheme(DEFAULT_COLOR_SCHEME); // Reset color scheme
              setLastCompletedSaleTotal(0); // Reset last completed sale total

              // Delete files (excluding CONFIG_BACKUP_FILE)
              await FileSystem.deleteAsync(INVENTORY_FILE, { idempotent: true });
              await FileSystem.deleteAsync(MENUS_FILE, { idempotent: true }); // Delete menus file
              await FileSystem.deleteAsync(COLOR_SCHEME_FILE, { idempotent: true }); // Delete color scheme file
              // await FileSystem.deleteAsync(CONFIG_BACKUP_FILE, { idempotent: true }); // Removed this line as per user request
              // Delete log directory contents
              const files = await FileSystem.readDirectoryAsync(LOG_DIRECTORY);
              for (const file of files) {
                await FileSystem.deleteAsync(LOG_DIRECTORY + file, { idempotent: true });
              }

              // Re-initialize to ensure default inventory and log file are created
              await saveMenus(DEFAULT_MENUS); // Save default menus first
              await loadInventory(DEFAULT_MENUS); // Pass default menus for inventory initialization
              await loadLogFromFile();
              await saveColorScheme(DEFAULT_COLOR_SCHEME); // Save default color scheme

              Alert.alert("Success", "All data has been reset and re-initialized.");
            } catch (e) {
              console.error("Failed to reset data:", e);
              Alert.alert("Error", "Failed to reset data.");
            } finally {
              setIsLoading(false);
              showMainView(); // Go back to main view
            }
          }
        }
      ]
    );
  };

  // Populates example items
  const populateExampleItems = async () => {
    Alert.alert(
      "Populate Example Items",
      "Are you sure you want to add example items to your inventory and menus? This will add new categories, brands, and items.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Add Examples",
          onPress: async () => {
            setIsLoading(true);
            try {
              let currentMenu = { ...menuData };
              let currentInventory = { ...inventory };

              EXAMPLE_MENUS.categories.forEach(exampleCategory => {
                let existingCategory = currentMenu.categories.find(c => c.name === exampleCategory.name);
                if (!existingCategory) {
                  existingCategory = { name: exampleCategory.name, brands: [] };
                  currentMenu.categories.push(existingCategory);
                }

                exampleCategory.brands.forEach(exampleBrand => {
                  let existingBrand = existingCategory.brands.find(b => b.name === exampleBrand.name);
                  if (!existingBrand) {
                    existingBrand = { name: exampleBrand.name, items: [] };
                    existingCategory.brands.push(existingBrand);
                  }

                  exampleBrand.items.forEach(exampleItem => {
                    const itemName = exampleItem.name;
                    const itemPrice = exampleItem.price !== undefined ? exampleItem.price : DEFAULT_ITEM_PRICE;

                    if (!existingBrand.items.some(i => i.name === itemName)) {
                      existingBrand.items.push({ name: itemName, price: itemPrice });
                    }

                    // Only add to inventory if not 'Clips, etc.' or 'Other' category
                    if (exampleCategory.name !== 'Clips, etc.' && exampleCategory.name !== 'Other') {
                      if (!currentInventory[exampleCategory.name]) {
                        currentInventory[exampleCategory.name] = {};
                      }
                      if (!currentInventory[exampleCategory.name][exampleBrand.name]) {
                        currentInventory[exampleCategory.name][exampleBrand.name] = {};
                      }

                      if (!currentInventory[exampleCategory.name][exampleBrand.name][itemName]) {
                        currentInventory[exampleCategory.name][exampleBrand.name][itemName] = {
                          itemCode: generateUniqueItemCode(exampleCategory.name, exampleBrand.name, itemName),
                          category: exampleCategory.name,
                          brand: exampleBrand.name,
                          item: itemName,
                          quantity: DEFAULT_ITEM_QUANTITY,
                          price: itemPrice,
                          lastChange: 'Initial (Example)',
                          lastChangeDate: new Date().toLocaleString()
                        };
                      }
                    }
                  });
                });
              });

              setMenuData(currentMenu);
              setInventory(currentInventory);
              await saveMenus(currentMenu);
              await saveInventory(currentInventory);

              Alert.alert("Success", "Example items have been added.");
            } catch (e) {
              console.error("Failed to populate example data:", e);
              Alert.alert("Error", "Failed to populate example data.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // --- Config Import/Export Functions ---
  const exportConfig = async () => {
    try {
      const menuContent = await FileSystem.readAsStringAsync(MENUS_FILE);
      const inventoryContent = await FileSystem.readAsStringAsync(INVENTORY_FILE);

      const configData = {
        menus: JSON.parse(menuContent),
        inventory: JSON.parse(inventoryContent)
      };

      await FileSystem.writeAsStringAsync(CONFIG_BACKUP_FILE, JSON.stringify(configData, null, 2));
      await Sharing.shareAsync(CONFIG_BACKUP_FILE);
      Alert.alert("Export Successful", "Configuration data exported to inventory_config_backup.json");
    } catch (e) {
      console.error("Failed to export config:", e);
      Alert.alert("Export Failed", "Could not export configuration data. Please try again.");
    }
  };

  const importConfig = async () => {
    Alert.alert(
      "Import Configuration",
      "Are you sure you want to import configuration data? This will OVERWRITE your current menus and inventory. To import, you must first manually place the 'inventory_config_backup.json' file into this app's documents folder on your device.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          onPress: async () => {
            setIsLoading(true);
            try {
              const fileInfo = await FileSystem.getInfoAsync(CONFIG_BACKUP_FILE);
              if (!fileInfo.exists) {
                Alert.alert("File Not Found", "Config backup file (inventory_config_backup.json) not found in the app's documents folder. Please ensure it is placed there manually before importing.");
                setIsLoading(false);
                return;
              }

              const content = await FileSystem.readAsStringAsync(CONFIG_BACKUP_FILE);
              const configData = JSON.parse(content);

              if (configData.menus && configData.inventory) {
                setMenuData(configData.menus);
                setInventory(configData.inventory);
                await saveMenus(configData.menus);
                await saveInventory(configData.inventory);
                Alert.alert("Import Successful", "Configuration data imported successfully.");
              } else {
                Alert.alert("Import Failed", "Invalid configuration file format. Please ensure the JSON contains 'menus' and 'inventory' keys.");
              }
            } catch (e) {
              console.error("Failed to import config:", e);
              Alert.alert("Import Failed", "Could not import configuration data. Please check the file format and ensure it is a valid JSON.");
            } finally {
              setIsLoading(false);
              showMainView(); // Go back to main view after import attempt
            }
          }
        }
      ]
    );
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading App Data...</Text>
      </SafeAreaView>
    );
  }

  // Determine current colors based on selected scheme
  const colors = getColors(colorScheme);

  // The main render function. It decides which screen to show.
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? 30 : 0 }]}>
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity style={styles.editModeButton} onPress={() => setIsEditModeEnabled(!isEditModeEnabled)}>
          <MaterialIcons name={isEditModeEnabled ? "lock-open" : "lock"} size={24} color={colors.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.headerText }]}>LeGrande Accents</Text>
        <TouchableOpacity style={[styles.devButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showDevelopmentView}>
          <Text style={[styles.devButtonText, { color: colors.headerText }]}>Dev</Text>
        </TouchableOpacity>
      </View>

      {currentView === 'main' ? (
        <MainScreen
          addToLog={addToLog}
          inventory={inventory}
          updateInventory={updateInventory}
          showLogView={showLogView}
          showInventoryView={showInventoryView}
          showMenuManagementView={showMenuManagementView} // Pass navigation to menu management
          menuData={menuData} // Pass hierarchical menu data
          colors={colors} // Pass colors to child components
          setInventory={setInventory} // Pass setInventory for custom item creation
          saveInventory={saveInventory} // Pass saveInventory for custom item creation
          saveMenus={saveMenus} // Pass saveMenus for custom item creation
          setMenuData={setMenuData} // Pass setMenuData for custom item creation
          setLastCompletedSaleTotal={setLastCompletedSaleTotal} // Pass setter for last completed sale total
        />
      ) : currentView === 'log' ? (
        <LogScreen
          log={log}
          showMainView={showMainView}
          showFileManagementView={showFileManagementView}
          colors={colors}
          lastCompletedSaleTotal={lastCompletedSaleTotal} // Pass last completed sale total
        />
      ) : currentView === 'inventory' ? (
        <InventoryManagementScreen
          inventory={inventory}
          updateInventory={updateInventory}
          addToLog={addToLog}
          showMainView={showMainView}
          menuData={menuData}
          colors={colors} // Pass colors
        />
      ) : currentView === 'file_management' ? (
        <FileManagementScreen showLogView={showLogView} colors={colors} />
      ) : currentView === 'development' ? (
        <DevelopmentScreen
          resetAppData={resetAppData}
          showMainView={showMainView}
          cashierNumber={cashierNumber}
          setCashierNumber={setCashierNumber}
          colorScheme={colorScheme} // Pass current scheme
          setColorScheme={setColorScheme} // Pass setter for scheme
          saveColorScheme={saveColorScheme} // Pass save function
          showMenuManagementView={showMenuManagementView} // Pass menu management view
          populateExampleItems={populateExampleItems} // Pass populate example items function
          exportConfig={exportConfig} // Pass export config function
          importConfig={importConfig} // Pass import config function
          colors={colors} // Pass colors
        />
      ) : currentView === 'menu_management' ? ( // Menu management screen rendering
        <MenuManagementScreen
          menuData={menuData}
          setMenuData={setMenuData}
          saveMenus={saveMenus}
          inventory={inventory}
          setInventory={setInventory}
          saveInventory={saveInventory}
          addToLog={addToLog}
          showMainView={showMainView}
          isEditModeEnabled={isEditModeEnabled}
          colors={colors} // Pass colors
        />
      ) : null}
    </SafeAreaView>
  );
};

// --- Main Screen Component ---
// This component handles the primary user interaction: selecting categories, brands, and items.
const MainScreen = ({ addToLog, inventory, updateInventory, showLogView, showInventoryView, showMenuManagementView, menuData, colors, setInventory, saveInventory, saveMenus, setMenuData, setLastCompletedSaleTotal }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [customItemInput, setCustomItemInput] = useState('');
  const [customItemPriceInput, setCustomItemPriceInput] = useState(String(DEFAULT_ITEM_PRICE.toFixed(2))); // State for custom item price
  const [searchTerm, setSearchTerm] = useState('');
  const [allSearchableItems, setAllSearchableItems] = useState([]); // State for flattened items for search
  const [currentSaleTotal, setCurrentSaleTotal] = useState(0); // State for current sale total
  const [currentSaleItems, setCurrentSaleItems] = useState([]); // State for items in the current sale
  const [isClipAdjustmentMode, setIsClipAdjustmentMode] = useState(false); // New state for clip adjustment mode

  // Effect to flatten all items for search whenever inventory or menuData changes
  useEffect(() => {
    const flattenedItems = [];
    menuData.categories.forEach(categoryObj => {
      categoryObj.brands.forEach(brandObj => {
        brandObj.items.forEach(itemObj => {
          // Only include items in search if they are tracked in inventory or are 'Clips, etc.'
          if (categoryObj.name === 'Clips, etc.') {
            flattenedItems.push({
              itemCode: generateUniqueItemCode(categoryObj.name, brandObj.name, itemObj.name),
              category: categoryObj.name,
              brand: brandObj.name,
              item: itemObj.name,
              quantity: 'N/A', // Not tracked in inventory
              price: itemObj.price,
              displayPath: `${categoryObj.name} > ${itemObj.name}` // Adjusted display path for clips
            });
          } else {
            const itemData = inventory[categoryObj.name]?.[brandObj.name]?.[itemObj.name];
            if (itemData) {
              flattenedItems.push({
                ...itemData,
                displayPath: `${categoryObj.name} > ${brandObj.name} > ${itemObj.name}`
              });
            }
          }
        });
      });
    });

    // Add dynamically added 'Other' items to the flattened list
    // Only include 'Other' custom items if they are logged, not if they are in inventory
    const otherCategory = menuData.categories.find(cat => cat.name === 'Other');
    if (otherCategory) {
      const customBrand = otherCategory.brands.find(brand => brand.name === 'Custom');
      if (customBrand) {
        customBrand.items.forEach(itemObj => {
          // For 'Other' custom items, we don't have them in 'inventory' state, so we construct a temporary itemData
          flattenedItems.push({
            itemCode: generateUniqueItemCode('Other', 'Custom', itemObj.name),
            category: 'Other',
            brand: 'Custom',
            item: itemObj.name,
            quantity: 'N/A', // Not tracked in inventory
            price: itemObj.price,
            displayPath: `Other > Custom > ${itemObj.name}`
          });
        });
      }
    }
    setAllSearchableItems(flattenedItems);
  }, [inventory, menuData]);


  // Filtered categories, brands, and items based on search term and current selection
  const filteredCategories = menuData.categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentCategoryObj = menuData.categories.find(cat => cat.name === selectedCategory);
  const filteredBrands = currentCategoryObj
    ? currentCategoryObj.brands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const currentBrandObj = currentCategoryObj?.brands.find(brand => brand.name === selectedBrand);
  const filteredItems = currentBrandObj
    ? currentBrandObj.items.filter(itemObj => // Filter item objects
        itemObj.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Filtered items for global search
  const globallyFilteredItems = allSearchableItems.filter(item =>
    item.displayPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedBrand(null);
    setSearchTerm('');
    setIsClipAdjustmentMode(false); // Hide picker if category changes
  };

  const handleBrandSelect = (brandName) => {
    setSelectedBrand(brandName);
    setSearchTerm('');
  };

  // Main function to handle item click for sale (with pricing options)
  const handleItemClickForSale = (category, brand, item) => {
    let itemData = inventory[category]?.[brand]?.[item];
    let priceToUse = itemData?.price; // Default to item's price if it exists

    // If item does not exist in inventory (e.g., a newly added 'Other' item or 'Clips, etc.')
    if (!itemData || category === 'Clips, etc.' || category === 'Other') {
      // For 'Clips, etc.' category, get price from menuData directly
      if (category === 'Clips, etc.') {
        const categoryObj = menuData.categories.find(c => c.name === category);
        const menuItem = categoryObj?.brands.find(b => b.name === 'Fixed Prices')?.items.find(i => i.name === item);
        if (menuItem) {
          priceToUse = menuItem.price;
          // For clips, construct a temporary itemData object for logging purposes
          const tempItemData = {
            itemCode: generateUniqueItemCode(category, brand, item),
            category: category,
            brand: brand,
            item: item,
            quantity: 'N/A', // Not tracked in inventory
            price: priceToUse,
          };
          // If in clip adjustment mode, go to price adjustment options
          if (isClipAdjustmentMode) {
            showPriceAdjustmentOptions(category, brand, item, priceToUse, true, tempItemData);
          } else {
            handleLogSale(category, brand, item, priceToUse, 'No', true, tempItemData);
          }
        } else {
          Alert.alert("Error", "Clip item not found in menu data.");
        }
        return; // Exit after logging sale
      } else if (category === 'Other') {
        // For 'Other' custom items, price is taken from the input field
        // This path is usually taken when selecting from search results for 'Other' items
        const categoryObj = menuData.categories.find(c => c.name === category);
        const brandObj = categoryObj?.brands.find(b => b.name === 'Custom');
        const menuItem = brandObj?.items.find(i => i.name === item);
        if (menuItem) {
          priceToUse = menuItem.price;
          const tempItemData = {
            itemCode: generateUniqueItemCode(category, brand, item),
            category: category,
            brand: brand,
            item: item,
            quantity: 'N/A', // Not tracked in inventory
            price: priceToUse,
          };
          handleLogSale(category, brand, item, priceToUse, 'No', true, tempItemData);
        } else {
          // This should ideally not be hit if the item is in `allSearchableItems`
          Alert.alert("Error", "Custom 'Other' item not found in menu data.");
        }
        return;
      } else {
        // This else branch should ideally not be hit for 'Other' category
        // as handleCustomItemSubmit is called directly from the "Log Sale" button.
        // Keeping it as a fallback for other dynamically added items if the flow changes.
        Alert.prompt(
          "Set Price for New Item", // Changed prompt title slightly
          `Enter price for "${item}" (Category: ${category}, Brand: ${brand}). An item code will be generated.`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm",
              onPress: (priceText) => {
                const price = parseFloat(priceText);
                if (!isNaN(price) && price >= 0) {
                  const newItemData = {
                    itemCode: generateUniqueItemCode(category, brand, item),
                    category: category,
                    brand: brand,
                    item: item,
                    quantity: DEFAULT_ITEM_QUANTITY,
                    price: price,
                    lastChange: 'Initial (New Item)',
                    lastChangeDate: new Date().toLocaleString()
                  };
                  updateInventory(category, brand, item, newItemData);
                  handleLogSale(category, brand, item, price, 'No');
                } else {
                  Alert.alert("Invalid Price", "Please enter a valid positive number for the price.");
                }
              },
            },
          ],
          "plain-text",
          String(DEFAULT_ITEM_PRICE.toFixed(2)),
          "numeric"
        );
        return; // Exit after prompting
      }
    }

    // For existing inventory items, check stock and then prompt for sale
    if (itemData.quantity <= 0) {
      Alert.alert(
        "Warning: Out of Stock",
        `${category} - ${brand} - ${item} is out of stock. Do you still want to sell it (allowing negative inventory)?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sell Anyway",
            onPress: () => {
              // Proceed with the sale flow, potentially allowing negative quantity
              Alert.alert(
                "Confirm Sale",
                `Sell "${item}" for $${itemData.price.toFixed(2)}?`,
                [
                  {
                    text: "Sell at Full Price",
                    onPress: () => handleLogSale(category, brand, item, itemData.price, 'No'),
                  },
                  {
                    text: "Adjust Price / Discount",
                    onPress: () => showPriceAdjustmentOptions(category, brand, item, itemData.price),
                  },
                  {
                    text: "Cancel",
                    style: "cancel",
                  },
                ]
              );
            },
          },
        ]
      );
      return; // Exit here, as the user will either cancel or proceed via the nested alert
    }

    // Original flow for in-stock items
    Alert.alert(
      "Confirm Sale",
      `Sell "${item}" for $${itemData.price.toFixed(2)}?`,
      [
        {
          text: "Sell at Full Price",
          onPress: () => handleLogSale(category, brand, item, itemData.price, 'No'),
        },
        {
          text: "Adjust Price / Discount",
          onPress: () => showPriceAdjustmentOptions(category, brand, item, itemData.price),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const showPriceAdjustmentOptions = (category, brand, item, currentPrice, noInventoryUpdate = false, passedItemData = null) => {
    Alert.alert(
      "Price Adjustment",
      `Choose an option for "${item}" (Current: $${currentPrice.toFixed(2)})`,
      [
        {
          text: "Apply 10% Discount",
          onPress: () => {
            const discountedPrice = currentPrice * 0.9;
            // For clips and other items, we need to pass a temporary itemData for logging
            const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
            handleLogSale(category, brand, item, discountedPrice, '10% Discount', noInventoryUpdate, tempItemData);
            setIsClipAdjustmentMode(false); // Exit clip adjustment mode
          },
        },
        {
          text: "Apply 40% Discount",
          onPress: () => {
            const discountedPrice = currentPrice * 0.6; // 100% - 40% = 60%
            const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
            handleLogSale(category, brand, item, discountedPrice, '40% Discount', noInventoryUpdate, tempItemData);
            setIsClipAdjustmentMode(false); // Exit clip adjustment mode
          },
        },
        {
          text: "Apply 60% Discount",
          onPress: () => {
            const discountedPrice = currentPrice * 0.4; // 100% - 60% = 40%
            const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
            handleLogSale(category, brand, item, discountedPrice, '60% Discount', noInventoryUpdate, tempItemData);
            setIsClipAdjustmentMode(false); // Exit clip adjustment mode
          },
        },
        {
          text: "Manual Override",
          onPress: () => {
            Alert.prompt(
              "Override Price",
              `Enter new price for "${item}":`,
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Confirm",
                  onPress: (newPriceText) => {
                    const newPrice = parseFloat(newPriceText);
                    if (!isNaN(newPrice) && newPrice >= 0) {
                      const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
                      handleLogSale(category, brand, item, newPrice, 'Manual Override', noInventoryUpdate, tempItemData);
                      setIsClipAdjustmentMode(false); // Exit clip adjustment mode
                    } else {
                      Alert.alert("Invalid Price", "Please enter a valid positive number for the price.");
                    }
                  },
                },
              ],
              "plain-text",
              String(currentPrice.toFixed(2)),
              "numeric"
            );
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setIsClipAdjustmentMode(false), // Exit clip adjustment mode on cancel
        },
      ]
    );
  };

  const handleLogSale = (category, brand, item, priceSold, discountApplied, noInventoryUpdate = false, passedItemData = null) => {
    // Use passedItemData if available (for newly created custom items or clips), otherwise fetch from state
    const itemData = passedItemData || inventory[category]?.[brand]?.[item];

    if (!itemData) {
      console.error("Error: itemData is undefined in handleLogSale for", category, brand, item);
      Alert.alert("Error", "Could not log sale due to missing item data. Please try again.");
      return; // Prevent crash
    }

    const saleItem = {
      saleItemId: Date.now() + Math.random(), // Unique ID for removal
      category,
      brand,
      item,
      itemCode: itemData.itemCode || generateUniqueItemCode(category, brand, item), // Ensure itemCode is present
      priceSold,
      discountApplied,
      isInventoryTracked: category !== 'Clips, etc.' && category !== 'Other', // Flag to know if inventory needs reversal
      originalQuantityChange: noInventoryUpdate ? 0 : -1, // Store the change for reversal
    };
    setCurrentSaleItems(prevItems => [...prevItems, saleItem]);
    setCurrentSaleTotal(prevTotal => prevTotal + priceSold);

    if (!noInventoryUpdate && saleItem.isInventoryTracked) { // Only update inventory if tracked
      const newQuantity = itemData.quantity - 1;
      const quantityChange = -1;
      const lastChange = `${quantityChange}`;
      const lastChangeDate = new Date().toLocaleString();

      updateInventory(category, brand, item, {
        ...itemData,
        quantity: newQuantity,
        lastChange: lastChange,
        lastChangeDate: lastChangeDate
      });
      addToLog("Sold Item", itemData.itemCode, category, brand, item, quantityChange, newQuantity, priceSold, discountApplied);
    } else {
      // For items not tracked in inventory (like 'Clips, etc.' or 'Other'), just log the sale
      const itemCode = itemData.itemCode || generateUniqueItemCode(category, brand, item); // Use itemData.itemCode if available, otherwise generate
      addToLog("Sold Item (No Inventory Track)", itemCode, category, brand, item, 'N/A', 'N/A', priceSold, discountApplied);
    }

    setSelectedCategory(null);
    setSelectedBrand(null);
    setCustomItemInput('');
    setSearchTerm('');
  };

  // Function to remove the most recent item from the current sale
  const handleUndoLastSaleItem = () => {
    if (currentSaleItems.length === 0) {
      Alert.alert("No Items", "There are no items in the current sale to undo.");
      return;
    }

    Alert.alert(
      "Undo Last Item",
      "Are you sure you want to remove the last item from the sale and revert inventory?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Undo",
          onPress: () => {
            setCurrentSaleItems(prevItems => {
              const lastItem = prevItems[prevItems.length - 1]; // Get the last item
              if (!lastItem) return prevItems; // Should not happen due to initial check

              // Revert inventory if it was an inventory-tracked item
              if (lastItem.isInventoryTracked) {
                const itemData = inventory[lastItem.category]?.[lastItem.brand]?.[lastItem.item];
                if (itemData) {
                  const newQuantity = itemData.quantity - lastItem.originalQuantityChange; // originalQuantityChange is -1, so this adds 1
                  updateInventory(lastItem.category, lastItem.brand, lastItem.item, {
                    ...itemData,
                    quantity: newQuantity,
                    lastChange: `Removed from Sale (+${-lastItem.originalQuantityChange})`,
                    lastChangeDate: new Date().toLocaleString()
                  });
                  addToLog("Removed from Sale", lastItem.itemCode, lastItem.category, lastItem.brand, lastItem.item, -lastItem.originalQuantityChange, newQuantity, lastItem.priceSold, lastItem.discountApplied);
                }
              } else {
                // Log removal for non-inventory tracked items (e.g., clips or other)
                addToLog("Removed from Sale (No Inventory Revert)", lastItem.itemCode, lastItem.category, lastItem.brand, lastItem.item, 'N/A', 'N/A', lastItem.priceSold, lastItem.discountApplied);
              }

              setCurrentSaleTotal(prevTotal => prevTotal - lastItem.priceSold);
              return prevItems.slice(0, -1); // Return all but the last item
            });
          }
        }
      ]
    );
  };


  // Function to end the current sale
  const handleEndSale = () => {
    Alert.alert(
      "Sale Complete",
      `Total for this sale: $${currentSaleTotal.toFixed(2)}`,
      [{ text: "OK", onPress: () => {
        setLastCompletedSaleTotal(currentSaleTotal); // Set last completed sale total before resetting current
        setCurrentSaleTotal(0);
        setCurrentSaleItems([]); // Reset sale items on OK
      } }]
    );
  };

  // Function to cancel the current sale
  const handleCancelSale = () => {
    Alert.alert(
      "Cancel Sale",
      "Are you sure you want to cancel the current sale? This will clear the total and revert inventory.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            currentSaleItems.forEach(itemToRemove => {
                if (itemToRemove.isInventoryTracked) {
                    const itemData = inventory[itemToRemove.category]?.[itemToRemove.brand]?.[itemToRemove.item];
                    if (itemData) {
                        const newQuantity = itemData.quantity - itemToRemove.originalQuantityChange;
                        updateInventory(itemToRemove.category, itemToRemove.brand, itemToRemove.item, {
                            ...itemData,
                            quantity: newQuantity,
                            lastChange: `Sale Cancelled (+${-itemToRemove.originalQuantityChange})`,
                            lastChangeDate: new Date().toLocaleString()
                        });
                        addToLog("Sale Cancelled", itemToRemove.itemCode, itemToRemove.category, itemToRemove.brand, itemToRemove.item, -itemToRemove.originalQuantityChange, newQuantity, itemToRemove.priceSold, itemToRemove.discountApplied);
                    }
                } else {
                    addToLog("Sale Cancelled (No Inventory Revert)", itemToRemove.itemCode, itemToRemove.category, itemToRemove.brand, itemToRemove.item, 'N/A', 'N/A', itemToRemove.priceSold, itemToRemove.discountApplied);
                }
            });
            setLastCompletedSaleTotal(0); // Reset last completed sale total on cancel
            setCurrentSaleTotal(0);
            setCurrentSaleItems([]);
          }
        }
      ]
    );
  };


  // Handle submitting a custom item for the 'Other' category or a new item under a brand
  const handleCustomItemSubmit = () => {
    if (customItemInput.trim() === '') {
      Alert.alert("Input Required", "Please enter an item name.");
      return;
    }
    const customItemName = customItemInput.trim();
    const price = parseFloat(customItemPriceInput); // Get price directly from input
    if (isNaN(price) || price < 0) {
      Alert.alert("Invalid Price", "Please enter a valid positive number for the price.");
      return;
    }

    // Determine the target category and brand based on current selection, defaulting to 'Other'/'Custom'
    const targetCategory = selectedCategory || 'Other';
    const targetBrand = selectedBrand || 'Custom';

    let categoryFound = false;
    let brandFound = false;

    const updatedCategories = menuData.categories.map(cat => {
        if (cat.name === targetCategory) {
            categoryFound = true;
            let updatedBrands = cat.brands.map(brand => {
                if (brand.name === targetBrand) {
                    brandFound = true;
                    // Check if item already exists to prevent duplicates
                    if (brand.items.some(itemObj => itemObj.name === customItemName)) {
                        Alert.alert("Duplicate Item", `Item "${customItemName}" already exists in ${targetCategory} > ${targetBrand}.`);
                        return brand; // Return original brand, do not add
                    }
                    return { ...brand, items: [...brand.items, { name: customItemName, price: price }] };
                }
                return brand;
            });
            if (!brandFound) {
                updatedBrands = [...updatedBrands, { name: targetBrand, items: [{ name: customItemName, price: price }] }];
            }
            return { ...cat, brands: updatedBrands };
        }
        return cat;
    });

    if (!categoryFound) {
        updatedCategories.push({
            name: targetCategory,
            brands: [{ name: targetBrand, items: [{ name: customItemName, price: price }] }]
        });
    }

    const finalMenuData = { ...menuData, categories: updatedCategories };
    setMenuData(finalMenuData);
    saveMenus(finalMenuData);

    // For 'Other' custom items, we only log the sale, not add to inventory state
    const newItemData = {
      itemCode: generateUniqueItemCode(targetCategory, targetBrand, customItemName),
      category: targetCategory,
      brand: targetBrand,
      item: customItemName,
      quantity: 'N/A', // Not tracked in inventory
      price: price,
      lastChange: 'Initial (Custom Item)',
      lastChangeDate: new Date().toLocaleString()
    };

    // Log the sale of this newly added custom item. Do NOT update inventory state for 'Other' category.
    handleLogSale(targetCategory, targetBrand, customItemName, price, 'No', true, newItemData); // Pass newItemData directly and set noInventoryUpdate to true
    setCustomItemInput(''); // Clear custom item input
    setCustomItemPriceInput(String(DEFAULT_ITEM_PRICE.toFixed(2))); // Reset price input
  };


  return (
    <View style={styles.contentContainer}>
      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Search for item by name or code..."
        placeholderTextColor={colors.logDetails}
        value={searchTerm}
        onChangeText={setSearchTerm}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {searchTerm.length > 0 ? (
        // --- Global Search Results View ---
        <ScrollView style={styles.selectionScrollView}>
          <Text style={[styles.title, { color: colors.text }]}>Search Results</Text>
          <View style={styles.buttonGrid}>
            {globallyFilteredItems.length > 0 ? (
              globallyFilteredItems.map((itemData) => (
                <TouchableOpacity
                  key={itemData.itemCode} // Use itemCode for unique key
                  style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }]}
                  onPress={() => handleItemClickForSale(itemData.category, itemData.brand, itemData.item)}>
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    {itemData.category === 'Clips, etc.' || itemData.category === 'Other' ? `${itemData.item}` : itemData.item}
                  </Text>
                  <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Code: {itemData.itemCode}</Text>
                  {(itemData.category !== 'Clips, etc.' && itemData.category !== 'Other') && ( // Only show price for inventory-tracked items here
                    <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Price: ${itemData.price.toFixed(2)}</Text>
                  )}
                  {(itemData.category !== 'Clips, etc.' && itemData.category !== 'Other') && itemData.quantity !== 'N/A' && (
                    <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Qty: {itemData.quantity}</Text>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.buttonText, { color: colors.text, width: '100%', textAlign: 'center' }]}>No matching items found.</Text>
            )}
          </View>
          {/* Option to add a custom item if search yields no results or for general custom items */}
          <Text style={[styles.subtitle, { color: colors.text }]}>Can't find it? Add a custom item:</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="e.g., New Custom Product Name"
            placeholderTextColor={colors.logDetails}
            value={customItemInput}
            onChangeText={setCustomItemInput}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <Text style={[styles.inputLabel, { color: colors.text }]}>Price:</Text>
          <TextInput // Price input for custom item
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="e.g., 25.00" // Changed placeholder to be more direct
            placeholderTextColor={colors.logDetails}
            keyboardType="numeric"
            value={customItemPriceInput}
            onChangeText={setCustomItemPriceInput}
          />
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleCustomItemSubmit}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Log Sale: {customItemInput || 'Custom Item'}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        // --- Standard Category/Brand/Item Selection View ---
        <>
          {!selectedCategory ? (
            // --- Category Selection View ---
            <ScrollView style={styles.selectionScrollView}>
              <Text style={[styles.title, { color: colors.text }]}>1. Select a Category</Text>
              <View style={styles.buttonGrid}>
                {filteredCategories.map((categoryObj) => (
                  <TouchableOpacity
                    key={categoryObj.name}
                    style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }]}
                    onPress={() => handleCategorySelect(categoryObj.name)}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>{categoryObj.name}</Text>
                    <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Code: {getCategoryCode(categoryObj.name)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : !selectedBrand && selectedCategory !== 'Other' && selectedCategory !== 'Clips, etc.' ? (
            // --- Brand Selection View (for selected category, excluding 'Other' and 'Clips, etc.') ---
            <ScrollView style={styles.selectionScrollView}>
              <Text style={[styles.title, { color: colors.text }]}>2. Select a Brand for {selectedCategory}</Text>
              <View style={styles.buttonGrid}>
                {filteredBrands.map((brandObj) => (
                  <TouchableOpacity
                    key={brandObj.name}
                    style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }]}
                    onPress={() => handleBrandSelect(brandObj.name)}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>{brandObj.name}</Text>
                    <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Code: {getBrandCode(selectedCategory, brandObj.name)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }]}
                  onPress={showMenuManagementView}>
                  <Text style={[styles.buttonText, { color: colors.text }]}>+ Add/Manage Brands</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={() => setSelectedCategory(null)}>
                <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Categories'}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : selectedCategory === 'Clips, etc.' ? (
            // --- Clips, etc. Item Selection View (directly show items, no brand selection) ---
            <ScrollView style={styles.selectionScrollView}>
              <Text style={[styles.title, { color: colors.text }]}>Fixed Price Options for Clips, etc.</Text>
              <View style={styles.buttonGrid}>
                {menuData.categories.find(c => c.name === 'Clips, etc.')?.brands.find(b => b.name === 'Fixed Prices')?.items.map((itemObj) => (
                  <TouchableOpacity
                    key={itemObj.name}
                    style={[
                      styles.button,
                      { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor },
                      isClipAdjustmentMode && { borderColor: colors.buttonBgSecondary, borderWidth: 2 } // Subtle color change
                    ]}
                    onPress={() => handleItemClickForSale('Clips, etc.', 'Fixed Prices', itemObj.name)}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>{itemObj.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Button to adjust price for clips */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.buttonBgSecondary, marginTop: 15 },
                  isClipAdjustmentMode && { backgroundColor: colors.buttonBgPrimary } // Change color when active
                ]}
                onPress={() => setIsClipAdjustmentMode(!isClipAdjustmentMode)}>
                <Text style={[styles.buttonText, { color: colors.headerText }]}>
                  {isClipAdjustmentMode ? 'Exit Price Adjustment Mode' : 'Adjust Price / Discount for Clips'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={() => { setSelectedCategory(null); setIsClipAdjustmentMode(false); }}>
                <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Categories'}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : selectedCategory === 'Other' || selectedBrand ? (
            // --- Item Selection or Custom Item Input View ---
            <ScrollView style={styles.selectionScrollView}>
              <Text style={[styles.title, { color: colors.text }]}>
                {selectedCategory === 'Other' ? 'Enter Custom Item for "Other"' : `3. Select an Item for ${selectedCategory} - ${selectedBrand}`}
              </Text>

              {selectedCategory !== 'Other' && ( // Show predefined items if not 'Other'
                <View style={styles.buttonGrid}>
                  {filteredItems.map((itemObj) => { // Iterate over item objects
                    const itemName = itemObj.name;
                    const itemData = inventory[selectedCategory]?.[selectedBrand]?.[itemName];
                    return (
                      <TouchableOpacity
                        key={itemName}
                        style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }]}
                        onPress={() => handleItemClickForSale(selectedCategory, selectedBrand, itemName)}>
                        <Text style={[styles.buttonText, { color: colors.text }]}>
                          {itemObj.category === 'Clips, etc.' ? `${itemObj.name}` : itemName}
                        </Text>
                        {itemData && (itemData.category !== 'Clips, etc.' ? (
                          <>
                            <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Code: {itemData.itemCode}</Text>
                            <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Price: ${itemData.price.toFixed(2)}</Text>
                          </>
                        ) : (
                          <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Price: ${itemData.price.toFixed(2)}</Text>
                        ))}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }]}
                    onPress={showMenuManagementView}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>+ Add/Manage Items</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={[styles.subtitle, { color: colors.text }]}>Or Enter a Custom Item Name:</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="e.g., Custom Item Name"
                placeholderTextColor={colors.logDetails}
                value={customItemInput}
                onChangeText={setCustomItemInput}
                autoCapitalize="words"
                autoCorrect={false}
              />
              <Text style={[styles.inputLabel, { color: colors.text }]}>Price:</Text>
              <TextInput // Price input for custom item
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="e.g., 25.00" // Changed placeholder to be more direct
                placeholderTextColor={colors.logDetails}
                keyboardType="numeric"
                value={customItemPriceInput}
                onChangeText={setCustomItemPriceInput}
              />
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleCustomItemSubmit}>
                <Text style={[styles.buttonText, { color: colors.headerText }]}>Log Sale: {customItemInput || 'Custom Item'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={() => {
                if (selectedCategory === 'Other') {
                  setSelectedCategory(null); // Back to categories from 'Other' input
                } else {
                  setSelectedBrand(null); // Back to brands from item selection
                }
              }}>
                <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back'}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </>
      )}

      <View style={[styles.footer, { borderTopColor: colors.logEntryBorder, backgroundColor: colors.background }]}>
        {currentSaleTotal > 0 ? ( // Conditionally render sale buttons
          <View style={styles.saleActionsContainer}>
            <TouchableOpacity style={[styles.endSaleButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleEndSale}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Complete Sale: ${currentSaleTotal.toFixed(2)}</Text>
            </TouchableOpacity>
            <View style={styles.editCancelButtons}>
              <TouchableOpacity
                style={[styles.undoLastItemButton, { backgroundColor: colors.buttonBgSecondary, opacity: currentSaleItems.length === 0 ? 0.5 : 1 }]}
                onPress={handleUndoLastSaleItem}
                disabled={currentSaleItems.length === 0}
              >
                <Text style={[styles.buttonText, { color: colors.headerText }]}>Undo Last Item</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelSaleButton, { backgroundColor: colors.buttonBgDanger }]} onPress={handleCancelSale}>
                <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel Sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : ( // Render original buttons
          <>
            <TouchableOpacity style={[styles.logButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showLogView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>View Activity Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inventoryButton, { backgroundColor: colors.buttonBgTertiary }]} onPress={showInventoryView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Manage Inventory</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

// --- Log Screen Component ---
// This component displays the running log of all entries.
const LogScreen = ({ log, showMainView, showFileManagementView, colors, lastCompletedSaleTotal }) => {
  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Activity Log</Text>
      {lastCompletedSaleTotal > 0 && (
        <View style={[styles.mostRecentSaleContainer, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
          <Text style={[styles.mostRecentSaleText, { color: colors.warningText }]}>
            Most Recent Sale Total: ${lastCompletedSaleTotal.toFixed(2)}
          </Text>
        </View>
      )}
      <ScrollView style={[styles.logContainer, { backgroundColor: colors.cardBg, marginTop: lastCompletedSaleTotal > 0 ? 10 : 0 }]}>
        {log.length > 0 ? (
          // Reverse the log to show most recent entries first
          [...log].reverse().map((entry, index) => (
            <View key={index} style={[styles.logEntry, { borderBottomColor: colors.logEntryBorder }]}>
              <Text style={[styles.logEntryText, { color: colors.logEntryText }]}>
                <Text style={[styles.logEntryTimestamp, { color: colors.logTimestamp }]}>{entry.timestamp}</Text>
                <Text style={[styles.logEntryAction, { color: colors.logAction }]}> - {entry.action}</Text>
              </Text>
              <Text style={[styles.logEntryDetails, { color: colors.logDetails }]}>
                Item: {entry.category} - {entry.brand} - {entry.item} (Code: {entry.itemCode})
              </Text>
              <Text style={[styles.logEntryDetails, { color: colors.logDetails }]}>
                Change: {entry.quantityChange}, New Qty: {entry.newQuantity}
              </Text>
              {entry.priceSold !== 'N/A' && (
                <Text style={[styles.logEntryDetails, { color: colors.logDetails }]}>
                  Price Sold: ${parseFloat(entry.priceSold).toFixed(2)} {entry.discountApplied !== 'No' ? `(Discount: ${entry.discountApplied})` : ''}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={[styles.logEntryText, { color: colors.text }]}>No entries yet for today.</Text>
        )}
      </ScrollView>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={showFileManagementView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Manage Log Files</Text>
      </TouchableOpacity>
      {/* Adjusted style for this back button */}
      <TouchableOpacity style={[styles.backButton, styles.largeBackButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showMainView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Main App'}</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} /> {/* Buffer for soft buttons */}
    </View>
  );
};

// --- Inventory Management Screen Component ---
const InventoryManagementScreen = ({ inventory, updateInventory, addToLog, showMainView, menuData, colors }) => {
  const [searchTerm, setSearchTerm] = useState(''); // State for search term in inventory

  const handleAdjustQuantity = (category, brand, item, adjustment) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const currentQuantity = itemData.quantity;
    const newQuantity = currentQuantity + adjustment; // Allow negative for manual adjustments
    const quantityChange = adjustment;
    const lastChange = `${quantityChange > 0 ? '+' : ''}${quantityChange}`;
    const lastChangeDate = new Date().toLocaleString();

    updateInventory(category, brand, item, {
      ...itemData,
      quantity: newQuantity,
      lastChange: lastChange,
      lastChangeDate: lastChangeDate
    });
    addToLog("Adjusted Inventory", itemData.itemCode, category, brand, item, lastChange, newQuantity, itemData.price, 'No'); // Log price as well
  };

  const handleManualQuantityChange = (category, brand, item, text) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const quantity = parseInt(text, 10);
    if (!isNaN(quantity)) { // Allow negative for manual input
      const currentQuantity = itemData.quantity;
      const quantityChange = quantity - currentQuantity;
      const lastChange = quantityChange !== 0 ? `${quantityChange > 0 ? '+' : ''}${quantityChange}` : 'N/A';
      const lastChangeDate = new Date().toLocaleString();

      updateInventory(category, brand, item, {
        ...itemData,
        quantity: quantity,
        lastChange: lastChange,
        lastChangeDate: lastChangeDate
      });
      addToLog("Manually Set Inventory", itemData.itemCode, category, brand, item, lastChange, quantity, itemData.price, 'No'); // Log price
    } else if (text === '') {
      // Allow clearing the input without immediately setting to 0
      // The actual quantity will remain as is until a valid number is entered
    } else {
      Alert.alert("Invalid Input", "Please enter a valid number.");
    }
  };

  const handleManualPriceChange = (category, brand, item, text) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const price = parseFloat(text);
    if (!isNaN(price) && price >= 0) {
      const oldPrice = itemData.price;
      const lastChange = `Price changed from $${oldPrice.toFixed(2)} to $${price.toFixed(2)}`;
      const lastChangeDate = new Date().toLocaleString();

      updateInventory(category, brand, item, {
        ...itemData,
        price: price,
        lastChange: lastChange,
        lastChangeDate: lastChangeDate
      });
      addToLog("Price Updated", itemData.itemCode, category, brand, item, 'N/A', itemData.quantity, price, 'No'); // Log price update
    } else if (text === '') {
      // Allow clearing the input without immediately setting to 0
    } else {
      Alert.alert("Invalid Input", "Please enter a valid positive number for the price.");
    }
  };

  // Filtered and organized inventory for display
  const filteredAndOrganizedInventory = menuData.categories
    .map(categoryObj => {
      // Exclude 'Clips, etc.' and 'Other' from inventory management display
      if (categoryObj.name === 'Clips, etc.' || categoryObj.name === 'Other') {
        return { ...categoryObj, brands: [] }; // Return category with empty brands to exclude it
      }

      const filteredBrands = categoryObj.brands
        .map(brandObj => {
          const filteredItems = brandObj.items
            .filter(itemObj => {
              // Only show items that are actually in the inventory and not 'Clips, etc.' or 'Other'
              const itemData = inventory[categoryObj.name]?.[brandObj.name]?.[itemObj.name];
              return itemData && (
                itemData.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                itemData.item.toLowerCase().includes(searchTerm.toLowerCase())
              );
            })
            .map(itemObj => inventory[categoryObj.name][brandObj.name][itemObj.name]);
          return { ...brandObj, items: filteredItems };
        })
        .filter(brandObj => brandObj.items.length > 0); // Only keep brands that have filtered items
      return { ...categoryObj, brands: filteredBrands };
    })
    .filter(categoryObj => categoryObj.brands.length > 0); // Only keep categories that have filtered brands

  // Removed separate handling for 'Other' custom items as they should not be displayed here.

  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Inventory Management</Text>
      <TextInput
        style={[styles.searchInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Search by item code or name..."
        placeholderTextColor={colors.logDetails}
        value={searchTerm}
        onChangeText={setSearchTerm}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView style={[styles.inventoryListContainer, { backgroundColor: colors.cardBg }]}>
        {filteredAndOrganizedInventory.length === 0 && (
          <Text style={[styles.logEntryText, { color: colors.text }]}>No items in inventory yet or matching your search.</Text>
        )}

        {filteredAndOrganizedInventory.map(categoryObj => (
          <View key={categoryObj.name}>
            <Text style={[styles.categoryHeader, { color: colors.text }]}>{categoryObj.name}</Text>
            {categoryObj.brands.map(brandObj => (
              <View key={`${categoryObj.name}-${brandObj.name}`}>
                <Text style={[styles.brandHeader, { color: colors.text }]}>{brandObj.name}</Text>
                {brandObj.items.map((item) => (
                  <View key={item.itemCode} style={[styles.inventoryItem, { borderBottomColor: colors.logEntryBorder }]}>
                    <View style={styles.inventoryItemDetails}>
                      <Text style={[styles.inventoryItemText, { color: colors.text }]}>{item.item}</Text>
                      <Text style={[styles.inventoryItemCode, { color: colors.logDetails }]}>Code: {item.itemCode}</Text>
                      {item.lastChange && item.lastChangeDate && (
                        <Text style={[styles.inventoryLastChange, { color: colors.logDetails }]}>Last: {item.lastChange} on {item.lastChangeDate}</Text>
                      )}
                    </View>
                    <View style={styles.inventoryControls}>
                      {/* Quantity Controls */}
                      <TouchableOpacity style={[styles.inventoryButtonSmall, { backgroundColor: colors.buttonBgLight }]} onPress={() => handleAdjustQuantity(item.category, item.brand, item.item, -1)}>
                        <Text style={[styles.buttonText, { color: colors.text }]}>-</Text>
                      </TouchableOpacity>
                      <TextInput
                        style={[styles.inventoryInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        keyboardType="numeric"
                        value={String(item.quantity)}
                        onChangeText={(text) => handleManualQuantityChange(item.category, item.brand, item.item, text)}
                      />
                      <TouchableOpacity style={[styles.inventoryButtonSmall, { backgroundColor: colors.buttonBgLight }]} onPress={() => handleAdjustQuantity(item.category, item.brand, item.item, 1)}>
                        <Text style={[styles.buttonText, { color: colors.text }]}>+</Text>
                      </TouchableOpacity>

                      {/* Price Controls */}
                      <Text style={[styles.priceLabel, { color: colors.text }]}>$</Text>
                      <TextInput
                        style={[styles.priceInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                        keyboardType="numeric"
                        value={item.price !== undefined ? String(item.price.toFixed(2)) : ''}
                        onChangeText={(text) => handleManualPriceChange(item.category, item.brand, item.item, text)}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={showMainView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Back to Main App</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} /> {/* Buffer for soft buttons */}
    </View>
  );
};

// --- File Management Screen Component ---
const FileManagementScreen = ({ showLogView, colors }) => {
  const [logFiles, setLogFiles] = useState([]);
  const [selectedFileContent, setSelectedFileContent] = useState(null);

  useEffect(() => {
    listLogFiles();
  }, []);

  const listLogFiles = async () => {
    try {
      await FileSystem.makeDirectoryAsync(LOG_DIRECTORY, { intermediates: true }); // Ensure directory exists
      const files = await FileSystem.readDirectoryAsync(LOG_DIRECTORY);
      // Filter for log files and sort by date (most recent first)
      const sortedFiles = files
        .filter(file => file.startsWith('inventory_log_') && file.endsWith('.csv')) // Filter for .csv
        .sort((a, b) => b.localeCompare(a)); // Reverse alphabetical for most recent first
      setLogFiles(sortedFiles);
    } catch (e) {
      console.error("Failed to list log files:", e);
      Alert.alert("Error", "Failed to list log files.");
    }
  };

  const readAndDisplayFile = async (fileName) => {
    const filePath = LOG_DIRECTORY + fileName;
    try {
      const content = await FileSystem.readAsStringAsync(filePath);
      setSelectedFileContent(content);
    } catch (e) {
      console.error("Failed to read file:", e);
      Alert.alert("Error", `Failed to read ${fileName}.`);
    }
  };

  const shareFile = async (filePath) => { // Accepts full path
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (fileInfo.exists) {
        await Sharing.shareAsync(filePath);
      } else {
        Alert.alert("File Not Found", `The file ${filePath.split('/').pop()} does not exist.`);
      }
    } catch (e) {
      console.error("Failed to share file:", e);
      Alert.alert("Error", `Failed to share ${filePath.split('/').pop()}. Make sure you have a sharing app installed.`);
    }
  };

  // Gets today's log file path for direct download button
  const getTodayLogFilePathForDisplay = () => { // Renamed to avoid conflict with App's internal one
    const date = new Date();
    const fileName = `inventory_log_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.csv`;
    return LOG_DIRECTORY + fileName; // Return full path
  };
  const todayLogFilePath = getTodayLogFilePathForDisplay();

  const exportInventoryAsCsv = async () => {
    try {
      const inventoryContent = await FileSystem.readAsStringAsync(INVENTORY_FILE);
      const inventoryData = JSON.parse(inventoryContent);

      let csvContent = "Category,Brand,Item,Item Code,Quantity,Price,Last Change,Last Change Date\n";
      for (const categoryName in inventoryData) {
        for (const brandName in inventoryData[categoryName]) {
          for (const itemName in inventoryData[categoryName][brandName]) {
            const item = inventoryData[categoryName][brandName][itemName];
            const safeCategory = item.category.includes(',') ? `"${item.category}"` : item.category;
            const safeBrand = item.brand.includes(',') ? `"${item.brand}"` : item.brand;
            const safeItem = item.item.includes(',') ? `"${item.item}"` : item.item;
            const safePrice = typeof item.price === 'number' ? item.price.toFixed(2) : 'N/A';

            csvContent += `${safeCategory},${safeBrand},${safeItem},${item.itemCode},${item.quantity},${safePrice},${item.lastChange},${item.lastChangeDate}\n`;
          }
        }
      }

      const fileName = `inventory_data_${new Date().toISOString().slice(0,10)}.csv`;
      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      await Sharing.shareAsync(filePath);
      Alert.alert("Export Successful", `Inventory data exported to ${fileName}`);

    } catch (e) {
      console.error("Failed to export inventory as CSV:", e);
      Alert.alert("Export Failed", "Could not export inventory as CSV. Please try again.");
    }
  };


  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Manage Log Files & Inventory</Text>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]}
        onPress={() => shareFile(todayLogFilePath)}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Download Current Day's Log (CSV)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary }]}
        onPress={() => shareFile(INVENTORY_FILE)}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Download Full Inventory (JSON)</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]}
        onPress={exportInventoryAsCsv}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Export Inventory as CSV</Text>
      </TouchableOpacity>

      <Text style={[styles.subtitle, { color: colors.text }]}>Previous Log Files:</Text>
      <ScrollView style={[styles.fileListContainer, { backgroundColor: colors.cardBg }]}>
        {logFiles.length > 0 ? (
          logFiles.map((fileName) => (
            <View key={fileName} style={[styles.fileItem, { borderBottomColor: colors.logEntryBorder }]}>
              <Text style={[styles.fileItemText, { color: colors.text }]}>{fileName}</Text>
              <View style={styles.fileItemActions}>
                <TouchableOpacity
                  style={[styles.smallActionButton, { backgroundColor: colors.buttonBgTertiary }]}
                  onPress={() => readAndDisplayFile(fileName)}
                >
                  <Text style={[styles.smallButtonText, { color: colors.headerText }]}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallActionButton, { backgroundColor: colors.buttonBgTertiary }]}
                  onPress={() => shareFile(LOG_DIRECTORY + fileName)} // Pass full path
                >
                  <Text style={[styles.smallButtonText, { color: colors.headerText }]}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.logEntryText, { color: colors.text }]}>No previous log files found.</Text>
        )}
      </ScrollView>

      {selectedFileContent && (
        <View style={[styles.fileContentModal, { backgroundColor: colors.background }]}>
          <Text style={[styles.fileContentTitle, { color: colors.text }]}>File Content:</Text>
          <ScrollView style={[styles.fileContentScroll, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.fileContentText, { color: colors.text }]}>{selectedFileContent}</Text>
          </ScrollView>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={() => setSelectedFileContent(null)}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Close View</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showLogView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Activity Log'}</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} /> {/* Buffer for soft buttons */}
    </View>
  );
};

// --- Menu Management Screen Component ---
const MenuManagementScreen = ({ menuData, setMenuData, saveMenus, inventory, setInventory, saveInventory, addToLog, showMainView, isEditModeEnabled, colors }) => {
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [selectedCategoryForBrand, setSelectedCategoryForBrand] = useState(null);
  const [newBrandInput, setNewBrandInput] = useState('');
  const [selectedBrandForItems, setSelectedBrandForItems] = useState(null);
  const [newItemInput, setNewItemInput] = useState('');
  const [newItemPriceInput, setNewItemPriceInput] = useState(String(DEFAULT_ITEM_PRICE.toFixed(2)));

  // Helper to get current categories and brands for display in dropdowns
  const availableCategories = menuData.categories.map(cat => cat.name);
  const availableBrandsForSelectedCategory = selectedCategoryForBrand
    ? menuData.categories.find(cat => cat.name === selectedCategoryForBrand)?.brands.map(brand => brand.name) || []
    : [];

  const handleAddCategory = () => {
    if (newCategoryInput.trim() !== '' && !menuData.categories.some(cat => cat.name === newCategoryInput.trim())) {
      const updatedCategories = [...menuData.categories, { name: newCategoryInput.trim(), brands: [] }];
      const updatedMenuData = { ...menuData, categories: updatedCategories };
      setMenuData(updatedMenuData);
      saveMenus(updatedMenuData);
      addToLog("Menu Changed", "N/A", newCategoryInput.trim(), "N/A", "N/A", "Category Added", "N/A", "N/A", "No");
      setNewCategoryInput('');
    } else {
      Alert.alert("Invalid Input", "Category cannot be empty or already exists.");
    }
  };

  const handleDeleteCategory = (categoryName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete category "${categoryName}" and all its brands and items? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            const updatedMenuData = {
              ...menuData,
              categories: menuData.categories.filter(cat => cat.name !== categoryName)
            };
            setMenuData(updatedMenuData);
            saveMenus(updatedMenuData);

            // Also remove from inventory, but not for 'Clips, etc.' or 'Other'
            if (categoryName !== 'Clips, etc.' && categoryName !== 'Other') {
              setInventory(prevInventory => {
                const newInventory = { ...prevInventory };
                delete newInventory[categoryName];
                saveInventory(newInventory);
                return newInventory;
              });
            }
            addToLog("Menu Changed", "N/A", categoryName, "N/A", "N/A", "Category Deleted", "N/A", "N/A", "No");
            setSelectedCategoryForBrand(null); // Reset selection if deleted
            setSelectedBrandForItems(null);
          }
        }
      ]
    );
  };

  const handleAddBrand = () => {
    if (!selectedCategoryForBrand) {
      Alert.alert("Selection Required", "Please select a category first.");
      return;
    }
    if (newBrandInput.trim() !== '') {
      const updatedMenuData = { ...menuData };
      const categoryIndex = updatedMenuData.categories.findIndex(cat => cat.name === selectedCategoryForBrand);
      if (categoryIndex !== -1) {
        const category = updatedMenuData.categories[categoryIndex];
        if (!category.brands.some(brand => brand.name === newBrandInput.trim())) {
          category.brands.push({ name: newBrandInput.trim(), items: [] });
          setMenuData(updatedMenuData);
          saveMenus(updatedMenuData);
          addToLog("Menu Changed", "N/A", selectedCategoryForBrand, newBrandInput.trim(), "N/A", "Brand Added", "N/A", "N/A", "No");
          setNewBrandInput('');
        } else {
          Alert.alert("Invalid Input", "Brand already exists in this category.");
        }
      }
    } else {
      Alert.alert("Invalid Input", "Brand cannot be empty.");
    }
  };

  const handleDeleteBrand = (categoryName, brandName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete brand "${brandName}" and all its items from "${categoryName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            const updatedMenuData = { ...menuData };
            const category = updatedMenuData.categories.find(cat => cat.name === categoryName);
            if (category) {
              // Prevent deleting the 'Fixed Prices' brand from 'Clips, etc.' or 'Custom' from 'Other'
              if ((categoryName === 'Clips, etc.' && brandName === 'Fixed Prices') || (categoryName === 'Other' && brandName === 'Custom')) {
                Alert.alert("Cannot Delete", "This brand is essential and cannot be deleted.");
                return;
              }

              const brand = category.brands.find(b => b.name === brandName);
              if (brand) {
                category.brands = category.brands.filter(b => b.name !== brandName); // Filter out the brand
                setMenuData(updatedMenuData);
                saveMenus(updatedMenuData);

                // Also remove from inventory, but not for 'Clips, etc.' or 'Other'
                if (categoryName !== 'Clips, etc.' && categoryName !== 'Other') {
                  setInventory(prevInventory => {
                    const newInventory = { ...prevInventory };
                    if (newInventory[categoryName]) {
                      delete newInventory[categoryName][brandName];
                      if (Object.keys(newInventory[categoryName]).length === 0) {
                        delete newInventory[categoryName]; // Remove category if empty
                      }
                    }
                    saveInventory(newInventory);
                    return newInventory;
                  });
                }
                addToLog("Menu Changed", "N/A", categoryName, brandName, "N/A", "Brand Deleted", "N/A", "N/A", "No");
                setSelectedBrandForItems(null); // Reset selection if deleted
              }
            }
          }
        }
      ]
    );
  };

  const handleAddItem = () => {
    if (!selectedCategoryForBrand || !selectedBrandForItems) {
      Alert.alert("Selection Required", "Please select a category and brand first.");
      return;
    }
    if (newItemInput.trim() === '') {
      Alert.alert("Input Required", "Item name cannot be empty.");
      return;
    }
    const itemPrice = parseFloat(newItemPriceInput);
    if (isNaN(itemPrice) || itemPrice < 0) {
      Alert.alert("Invalid Price", "Please enter a valid positive number for the item price.");
      return;
    }

    // Prevent adding items to 'Clips, etc.' or 'Other' category via this menu
    if (selectedCategoryForBrand === 'Clips, etc.' || selectedCategoryForBrand === 'Other') {
      Alert.alert("Cannot Add Item", "Items in 'Clips, etc.' and 'Other' categories are fixed or managed via custom input on the main screen and cannot be added manually here.");
      setNewItemInput('');
      setNewItemPriceInput(String(DEFAULT_ITEM_PRICE.toFixed(2)));
      return;
    }

    const updatedMenuData = { ...menuData };
    const categoryIndex = updatedMenuData.categories.findIndex(cat => cat.name === selectedCategoryForBrand);
    if (categoryIndex !== -1) {
      const category = updatedMenuData.categories[categoryIndex];
      const brandIndex = category.brands.findIndex(brand => brand.name === selectedBrandForItems);
      if (brandIndex !== -1) {
        const brand = category.brands[brandIndex];
        // Check if an item with the same name already exists
        if (!brand.items.some(itemObj => itemObj.name === newItemInput.trim())) {
          brand.items.push({ name: newItemInput.trim(), price: itemPrice }); // Add item as an object with price
          setMenuData(updatedMenuData);
          saveMenus(updatedMenuData);

          // Initialize new item in inventory, but not for 'Clips, etc.' or 'Other'
          if (selectedCategoryForBrand !== 'Clips, etc.' && selectedCategoryForBrand !== 'Other') {
            setInventory(prevInventory => {
              const newInventory = { ...prevInventory };
              if (!newInventory[selectedCategoryForBrand]) newInventory[selectedCategoryForBrand] = {};
              if (!newInventory[selectedCategoryForBrand][selectedBrandForItems]) newInventory[selectedCategoryForBrand][selectedBrandForItems] = {};
              newInventory[selectedCategoryForBrand][selectedBrandForItems][newItemInput.trim()] = {
                itemCode: generateUniqueItemCode(selectedCategoryForBrand, selectedBrandForItems, newItemInput.trim()),
                category: selectedCategoryForBrand,
                brand: selectedBrandForItems,
                item: newItemInput.trim(),
                quantity: DEFAULT_ITEM_QUANTITY,
                price: itemPrice,
                lastChange: 'Initial (Menu Add)',
                lastChangeDate: new Date().toLocaleString()
              };
              saveInventory(newInventory);
              return newInventory;
            });
          }

          addToLog("Menu Changed", "N/A", selectedCategoryForBrand, selectedBrandForItems, newItemInput.trim(), "Item Added", "N/A", itemPrice, "No");
          setNewItemInput('');
          setNewItemPriceInput(String(DEFAULT_ITEM_PRICE.toFixed(2))); // Reset price input
        } else {
          Alert.alert("Invalid Input", "Item already exists in this brand.");
        }
      }
    }
  };

  const handleDeleteItem = (categoryName, brandName, itemName) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete item "${itemName}" from "${categoryName} - ${brandName}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            const updatedMenuData = { ...menuData };
            const category = updatedMenuData.categories.find(cat => cat.name === categoryName);
            if (category) {
              const brand = category.brands.find(b => b.name === brandName);
              if (brand) {
                // Prevent deleting fixed price items from 'Clips, etc.' or 'Custom' from 'Other'
                if ((categoryName === 'Clips, etc.' && brandName === 'Fixed Prices') || (categoryName === 'Other' && brandName === 'Custom')) {
                  Alert.alert("Cannot Delete", "This item is essential and cannot be deleted manually.");
                  return;
                }

                brand.items = brand.items.filter(itemObj => itemObj.name !== itemName);
                setMenuData(updatedMenuData);
                saveMenus(updatedMenuData);

                // Also remove from inventory, but not for 'Clips, etc.' or 'Other'
                if (categoryName !== 'Clips, etc.' && categoryName !== 'Other') {
                  setInventory(prevInventory => {
                    const newInventory = { ...prevInventory };
                    if (newInventory[categoryName]?.[brandName]?.[itemName]) {
                      delete newInventory[categoryName][brandName][itemName];
                      if (Object.keys(newInventory[categoryName][brandName]).length === 0) {
                        delete newInventory[categoryName][brandName]; // Remove brand if empty
                        if (Object.keys(newInventory[categoryName]).length === 0) {
                          delete newInventory[categoryName]; // Remove category if empty
                        }
                      }
                    }
                    saveInventory(newInventory);
                    return newInventory;
                  });
                }
                addToLog("Menu Changed", "N/A", categoryName, brandName, itemName, "Item Deleted", "N/A", "N/A", "No");
              }
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Menu Management</Text>
      {!isEditModeEnabled && (
        <View style={[styles.editModeWarning, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
          <Text style={[styles.editModeWarningText, { color: colors.warningText }]}>
            Edit mode is currently disabled. Tap the <MaterialIcons name="lock" size={16} color={colors.warningText} /> icon in the top-left to enable editing.
          </Text>
        </View>
      )}

      {/* Manage Categories Section */}
      <Text style={[styles.subtitle, { color: colors.text }]}>Manage Categories</Text>
      <View style={[styles.currentListDisplay, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.currentListText, { color: colors.text }]}>Current Categories:</Text>
        <View style={styles.listItemsContainer}>
          {availableCategories.length > 0 ? (
            availableCategories.map(cat => (
              <View key={cat} style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
                <Text style={[styles.listItemText, { color: colors.text }]}>{cat}</Text>
                {isEditModeEnabled && cat !== 'Other' && cat !== 'Clips, etc.' && ( // Do not allow deleting 'Other' or 'Clips, etc.'
                  <TouchableOpacity onPress={() => handleDeleteCategory(cat)} style={[styles.deleteButton, { backgroundColor: colors.buttonBgDanger }]}>
                    <MaterialIcons name="delete" size={20} color={colors.headerText} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          ) : (
            <Text style={[styles.listItemText, { color: colors.text }]}>No categories defined.</Text>
          )}
        </View>
      </View>
      {isEditModeEnabled && (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Add New Category"
            placeholderTextColor={colors.logDetails}
            value={newCategoryInput}
            onChangeText={setNewCategoryInput}
          />
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleAddCategory}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Add Category</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Manage Brands Section */}
      <Text style={[styles.subtitle, { color: colors.text }]}>Manage Brands</Text>
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerLabel, { color: colors.text }]}>Select Category for Brand:</Text>
        <ScrollView horizontal={true} style={styles.horizontalPicker}>
          {availableCategories.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.pickerButton, { backgroundColor: colors.pickerBg }, selectedCategoryForBrand === cat && { backgroundColor: colors.pickerSelectedBg }]}
              onPress={() => {
                setSelectedCategoryForBrand(cat);
                setSelectedBrandForItems(null); // Reset brand selection when category changes
              }}>
              <Text style={[styles.pickerButtonText, { color: colors.pickerText }, selectedCategoryForBrand === cat && { color: colors.pickerSelectedText }]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {selectedCategoryForBrand && (
        <View style={[styles.currentListDisplay, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.currentListText, { color: colors.text }]}>Current Brands in {selectedCategoryForBrand}:</Text>
          <View style={styles.listItemsContainer}>
            {menuData.categories.find(c => c.name === selectedCategoryForBrand)?.brands.map(brandObj => (
              <View key={brandObj.name} style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
                <Text style={[styles.listItemText, { color: colors.text }]}>{brandObj.name}</Text>
                {isEditModeEnabled && !(selectedCategoryForBrand === 'Clips, etc.' && brandObj.name === 'Fixed Prices') && !(selectedCategoryForBrand === 'Other' && brandObj.name === 'Custom') && ( // Do not allow deleting 'Fixed Prices' brand from 'Clips, etc.' or 'Custom' from 'Other'
                  <TouchableOpacity onPress={() => handleDeleteBrand(selectedCategoryForBrand, brandObj.name)} style={[styles.deleteButton, { backgroundColor: colors.buttonBgDanger }]}>
                    <MaterialIcons name="delete" size={20} color={colors.headerText} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>
      )}
      {isEditModeEnabled && selectedCategoryForBrand && (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Add New Brand"
            placeholderTextColor={colors.logDetails}
            value={newBrandInput}
            onChangeText={setNewBrandInput}
          />
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleAddBrand}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Add Brand to {selectedCategoryForBrand}</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Manage Items Section */}
      <Text style={[styles.subtitle, { color: colors.text }]}>Manage Items</Text>
      <View style={styles.pickerContainer}>
        <Text style={[styles.pickerLabel, { color: colors.text }]}>Select Brand for Items:</Text>
        <ScrollView horizontal={true} style={styles.horizontalPicker}>
          {availableBrandsForSelectedCategory.map(brand => (
            <TouchableOpacity
              key={brand}
              style={[styles.pickerButton, { backgroundColor: colors.pickerBg }, selectedBrandForItems === brand && { backgroundColor: colors.pickerSelectedBg }]}
              onPress={() => setSelectedBrandForItems(brand)}>
              <Text style={[styles.pickerButtonText, { color: colors.pickerText }, selectedBrandForItems === brand && { color: colors.pickerSelectedText }]}>{brand}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      {selectedCategoryForBrand && selectedBrandForItems && (
        <View style={[styles.currentListDisplay, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.currentListText, { color: colors.text }]}>Current Items in {selectedBrandForItems}:</Text>
          <View style={styles.listItemsContainer}>
            {menuData.categories.find(c => c.name === selectedCategoryForBrand)?.brands.find(b => b.name === selectedBrandForItems)?.items.length > 0 ? (
              menuData.categories.find(c => c.name === selectedCategoryForBrand)?.brands.find(b => b.name === selectedBrandForItems)?.items.map(itemObj => (
                <View key={itemObj.name} style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
                  <Text style={[styles.listItemText, { color: colors.text }]}>{itemObj.name} (${itemObj.price.toFixed(2)})</Text>
                  {isEditModeEnabled && !(selectedCategoryForBrand === 'Clips, etc.' && selectedBrandForItems === 'Fixed Prices') && !(selectedCategoryForBrand === 'Other' && selectedBrandForItems === 'Custom') && ( // Do not allow deleting fixed price items or custom 'Other' items
                    <TouchableOpacity onPress={() => handleDeleteItem(selectedCategoryForBrand, selectedBrandForItems, itemObj.name)} style={[styles.deleteButton, { backgroundColor: colors.buttonBgDanger }]}>
                      <MaterialIcons name="delete" size={20} color={colors.headerText} />
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <Text style={[styles.listItemText, { color: colors.text }]}>No items in this brand.</Text>
            )}
          </View>
        </View>
      )}
      {isEditModeEnabled && selectedCategoryForBrand && selectedBrandForItems && (
        <>
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Add New Item Name"
            placeholderTextColor={colors.logDetails}
            value={newItemInput}
            onChangeText={setNewItemInput}
          />
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Initial Price (e.g., 25.00)"
            placeholderTextColor={colors.logDetails}
            keyboardType="numeric"
            value={newItemPriceInput}
            onChangeText={setNewItemPriceInput}
          />
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleAddItem}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Add Item to {selectedBrandForItems}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showMainView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Main App'}</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} />
    </ScrollView>
  );
};

// --- Development Screen Component ---
const DevelopmentScreen = ({ resetAppData, showMainView, cashierNumber, setCashierNumber, colorScheme, setColorScheme, saveColorScheme, showMenuManagementView, populateExampleItems, exportConfig, importConfig, colors }) => {
  const handleSetCashierNumber = () => {
    Alert.alert("Set Cashier Number", `Cashier number set to: ${cashierNumber}`);
  };

  const handleSetColorScheme = (scheme) => {
    setColorScheme(scheme);
    saveColorScheme(scheme); // Save the new scheme to file
    Alert.alert("Color Scheme", `Color scheme set to "${scheme}".`);
  };

  return (
    <ScrollView style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Development Tools</Text>

      {/* Color Scheme Section */}
      <Text style={[styles.subtitle, { color: colors.text }]}>Color Scheme</Text>
      <View style={styles.buttonGrid}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor },
            colorScheme === 'light' && { backgroundColor: colors.pickerSelectedBg }
          ]}
          onPress={() => handleSetColorScheme('light')}>
          <Text style={[styles.buttonText, { color: colors.text }, colorScheme === 'light' && { color: colors.pickerSelectedText }]}>Light Mode</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor },
            colorScheme === 'dark' && { backgroundColor: colors.pickerSelectedBg }
          ]}
          onPress={() => handleSetColorScheme('dark')}>
          <Text style={[styles.buttonText, { color: colors.text }, colorScheme === 'dark' && { color: colors.pickerSelectedText }]}>Dark Mode</Text>
        </TouchableOpacity>
      </View>

      {/* Cashier Number Section */}
      <Text style={[styles.subtitle, { color: colors.text }]}>Set Cashier Number</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Enter Cashier Number"
        placeholderTextColor={colors.logDetails}
        keyboardType="numeric"
        value={cashierNumber}
        onChangeText={setCashierNumber}
      />
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleSetCashierNumber}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Set Cashier: {cashierNumber}</Text>
      </TouchableOpacity>

      {/* Menu Management Link */}
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary, marginTop: 20 }]} onPress={showMenuManagementView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Go to Menu Management</Text>
      </TouchableOpacity>

      {/* Populate Example Items Button */}
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary, marginTop: 10 }]} onPress={populateExampleItems}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Populate Example Items</Text>
      </TouchableOpacity>

      {/* Config Import/Export Section */}
      <Text style={[styles.subtitle, { color: colors.text }]}>Config Import/Export</Text>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary, marginTop: 10 }]} onPress={exportConfig}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Export Config JSON</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary, marginTop: 10 }]} onPress={importConfig}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Import Config JSON</Text>
      </TouchableOpacity>


      {/* Reset Data Button */}
      <View style={[styles.resetSection, { borderTopColor: colors.logEntryBorder }]}>
        <TouchableOpacity style={[styles.resetButton, { backgroundColor: colors.buttonBgDanger }]} onPress={resetAppData}>
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Reset All App Data</Text>
        </TouchableOpacity>
        <Text style={[styles.resetWarningText, { color: colors.warningText }]}>
          Warning: This will permanently delete all inventory and log data. Use with caution.
        </Text>
      </View>

      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showMainView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Main App'}</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} />
    </ScrollView>
  );
};


// --- Styles ---
// This is where all the styling for the components is defined.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Background color is dynamic
    paddingBottom: Platform.OS === 'ios' ? 25 : 25, // Increased padding for iOS and Android
    paddingTop: Platform.OS === 'android' ? 30 : 0, // Added padding for Android status bar/camera hole
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5', // Stays light for loading
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333', // Stays dark for loading
  },
  header: {
    padding: 20,
    // Background color is dynamic
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row', // To place dev button
    position: 'relative',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    // Color is dynamic
  },
  devButton: {
    position: 'absolute',
    right: 15,
    top: 20,
    // Background color is dynamic
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  devButtonText: {
    // Color is dynamic
    fontSize: 14,
    fontWeight: 'bold',
  },
  editModeButton: { // Style for edit mode toggle
    position: 'absolute',
    left: 15,
    top: 20,
    backgroundColor: 'rgba(0,0,0,0.2)', // Stays semi-transparent black
    padding: 8,
    borderRadius: 5,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    // Removed paddingBottom here as it is handled by the main container and bottomBuffer
  },
  selectionScrollView: {
    flex: 1, // Ensure scroll view takes available space
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    // Color is dynamic
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    // Color is dynamic
    marginTop: 20,
    marginBottom: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    // Background color is dynamic
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '48%', // Two buttons per row with a small gap
    alignItems: 'center',
    marginBottom: 15,
    // Shadow color is dynamic
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    // Color is dynamic
    fontSize: 16,
    fontWeight: '500',
  },
  itemCodeSmall: { // Style for unique item code on main screen buttons
    fontSize: 10,
    // Color is dynamic
    marginTop: 5,
  },
  input: {
    // Background color is dynamic
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    // Border color is dynamic
    // Text color is dynamic
  },
  searchInput: { // Style for search input
    // Background color is dynamic
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    // Border color is dynamic
    // Text color is dynamic
  },
  actionButton: {
    // Background color is dynamic
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  downloadInventoryButton: {
    // Background color is dynamic (overridden in component)
  },
  backButton: {
    padding: 15, // Increased padding for larger touch target
    alignItems: 'center',
    marginTop: 20, // Increased margin from other elements
    // Background color is dynamic
    borderRadius: 10,
  },
  largeBackButton: { // Specific style for the LogScreen's back button
    paddingVertical: 15,
    paddingHorizontal: 25,
    minWidth: '80%', // Make it wider
  },
  backButtonText: {
    // Color is dynamic
    fontSize: 18, // Larger text
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    // Border top color is dynamic
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10, // Added padding for iOS home indicator, adjusted for Android
    // Background color is dynamic
  },
  logButton: {
    // Background color is dynamic
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  inventoryButton: {
    // Background color is dynamic
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  saleActionsContainer: { // Container for sale-related buttons
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  endSaleButton: { // Style for the Complete Sale button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10, // Space below complete sale button
  },
  editCancelButtons: { // Container for Edit and Cancel buttons
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  undoLastItemButton: { // Style for the new "Undo Last Item" button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  cancelSaleButton: { // Style for the Cancel Sale button
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  logContainer: {
    flex: 1,
    // Background color is dynamic
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  logEntry: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    // Border bottom color is dynamic
    marginBottom: 5,
  },
  logEntryText: {
    fontSize: 14,
    // Color is dynamic
  },
  logEntryTimestamp: {
    fontWeight: 'bold',
    // Color is dynamic
  },
  logEntryAction: {
    fontStyle: 'italic',
    // Color is dynamic
  },
  logEntryDetails: {
    fontSize: 12,
    // Color is dynamic
    marginLeft: 10, // Indent details
  },
  // Inventory Specific Styles
  inventoryListContainer: {
    flex: 1,
    // Background color is dynamic
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  categoryHeader: { // Style for category headers in inventory
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    // Border bottom color is dynamic
  },
  brandHeader: { // Style for brand headers in inventory
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 10,
  },
  inventoryItem: {
    flexDirection: 'column', // Changed to column to give space
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align details to start
    paddingVertical: 10,
    borderBottomWidth: 1,
    // Border bottom color is dynamic
  },
  inventoryItemDetails: {
    width: '100%', // Take full width
    marginBottom: 10, // Space between details and controls
  },
  inventoryItemText: {
    fontSize: 16,
    fontWeight: '500',
    // Color is dynamic
  },
  inventoryItemCode: {
    fontSize: 12,
    // Color is dynamic
  },
  inventoryLastChange: {
    fontSize: 10,
    // Color is dynamic
    fontStyle: 'italic',
  },
  inventoryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Align controls to start
    width: '100%', // Take full width
  },
  inventoryButtonSmall: {
    // Background color is dynamic
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  inventoryInput: {
    // Background color is dynamic
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    minWidth: 50,
    textAlign: 'center',
    fontSize: 16,
    borderWidth: 1,
    // Border color is dynamic
    // Text color is dynamic
  },
  priceLabel: {
    fontSize: 16,
    // Color is dynamic
    marginLeft: 10,
    marginRight: 2,
  },
  priceInput: {
    // Background color is dynamic
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    minWidth: 60,
    textAlign: 'center',
    fontSize: 16,
    borderWidth: 1,
    // Border color is dynamic
    // Text color is dynamic
  },
  sellButton: { // This style is unused
    backgroundColor: '#e74c3c',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
  },
  // File Management Specific Styles
  fileListContainer: {
    flex: 1,
    // Background color is dynamic
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  fileItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    // Border bottom color is dynamic
  },
  fileItemText: {
    fontSize: 14,
    // Color is dynamic
    flex: 1,
  },
  fileItemActions: {
    flexDirection: 'row',
  },
  smallActionButton: {
    // Background color is dynamic
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  smallButtonText: {
    // Color is dynamic
    fontSize: 12,
  },
  fileContentModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // Background color is dynamic
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fileContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    // Color is dynamic
  },
  fileContentScroll: {
    flex: 1,
    // Background color is dynamic
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  fileContentText: {
    fontSize: 14,
    // Color is dynamic
  },
  // Development Screen Styles
  resetButton: {
    // Background color is dynamic
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetWarningText: {
    fontSize: 14,
    // Color is dynamic
    textAlign: 'center',
    marginBottom: 20,
  },
  resetSection: { // Style for reset button section
    marginTop: 30,
    borderTopWidth: 1,
    // Border top color is dynamic
    paddingTop: 20,
    alignItems: 'center',
  },
  currentListText: { // For displaying current categories/brands in dev screen
    fontSize: 14,
    // Color is dynamic
    marginBottom: 10,
    textAlign: 'center',
  },
  bottomBuffer: { // Buffer for soft buttons
    height: Platform.OS === 'ios' ? 30 : 30, // Increased height
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    // Color is dynamic
    marginBottom: 10,
  },
  horizontalPicker: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 5,
  },
  pickerButton: {
    // Background color is dynamic
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  pickerButtonSelected: {
    // Background color is dynamic (overridden in component)
  },
  pickerButtonText: {
    // Color is dynamic
    fontSize: 14,
  },
  pickerButtonTextSelected: {
    // Color is dynamic (overridden in component)
    fontWeight: 'bold',
  },
  // Styles for Menu Management Screen
  editModeWarning: {
    // Background color is dynamic
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    // Border color is dynamic
    marginBottom: 20,
    alignItems: 'center',
  },
  editModeWarningText: {
    // Color is dynamic
    fontSize: 14,
    textAlign: 'center',
  },
  currentListDisplay: {
    // Background color is dynamic
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    // Border color is dynamic
  },
  listItemsContainer: {
    marginTop: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    // Border bottom color is dynamic
  },
  listItemText: {
    fontSize: 15,
    // Color is dynamic
    flex: 1,
  },
  deleteButton: {
    // Background color is dynamic
    padding: 5,
    borderRadius: 5,
  },
  inputLabel: { // Style for input labels
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    // Color is dynamic
  },
  currentSaleItemsContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 10,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 15,
  },
  currentSaleItemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  currentSaleItemsScroll: {
    maxHeight: 150, // Limit height to make it scrollable
  },
  currentSaleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  currentSaleItemText: {
    fontSize: 14,
    flex: 1,
  },
  removeSaleItemButton: {
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  centeredView: { // Styles for modal positioning
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)', // Semi-transparent background
  },
  modalView: { // Styles for modal content
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%', // Take up most of the width
    maxHeight: '80%', // Limit height
  },
  currentSaleTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  mostRecentSaleContainer: { // New style for the most recent sale display
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  mostRecentSaleText: { // New style for the text within the most recent sale display
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default App;
