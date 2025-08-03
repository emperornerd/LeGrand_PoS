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
  Platform,
  Modal
} from 'react-native';
import *as FileSystem from 'expo-file-system';
import *as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';

// --- File System Constants ---
const LOG_DIRECTORY = FileSystem.documentDirectory + 'inventory_logs/';
const INVENTORY_FILE = FileSystem.documentDirectory + 'inventory.json';
const MENUS_FILE = FileSystem.documentDirectory + 'menus.json';
const COLOR_SCHEME_FILE = FileSystem.documentDirectory + 'color_scheme.json';
const CONFIG_BACKUP_FILE = FileSystem.documentDirectory + 'inventory_config_backup.json';
const LAYAWAY_FILE = FileSystem.documentDirectory + 'layaway.json';

// --- Default Data for Initialization ---
const DEFAULT_ITEM_QUANTITY = 10;
const DEFAULT_ITEM_PRICE = 25.00;
const DEFAULT_MENUS = {
  categories: [
    { name: 'Other', brands: [] },
    {
      name: 'Clips, etc.',
      brands: [
        {
          name: 'Fixed Prices',
          items: [
            { name: '$2.00', price: 2.00 }, { name: '$5.00', price: 5.00 },
            { name: '$10.00', price: 10.00 }, { name: '$12.00', price: 12.00 },
            { name: '$14.00', price: 14.00 }, { name: '$18.00', price: 18.00 },
            { name: '$20.00', price: 20.00 }, { name: '$22.00', price: 22.00 },
            { name: '$25.00', price: 25.00 }, { name: '$30.00', price: 30.00 },
            { name: '$40.00', price: 40.00 }, { name: '$50.00', price: 50.00 },
            { name: '$60.00', price: 60.00 }, { name: '$70.00', price: 70.00 },
            { name: '$80.00', price: 80.00 }, { name: '$90.00', price: 90.00 },
            { name: '$100.00', price: 100.00 }, { name: '$110.00', price: 110.00 },
            { name: '$120.00', price: 120.00 }, { name: '$130.00', price: 130.00 },
            { name: '$140.00', price: 140.00 }, { name: '$150.00', price: 150.00 },
            { name: '$160.00', price: 160.00 }, { name: '$170.00', price: 170.00 },
            { name: '$180.00', price: 180.00 }, { name: '$190.00', price: 190.00 },
            { name: '$200.00', price: 200.00 }, { name: '$250.00', price: 250.00 },
          ]
        }
      ]
    }
  ]
};
const DEFAULT_COLOR_SCHEME = 'light';

// --- Color Palettes ---
const COLOR_PALETTES = {
  light: {
    background: '#f0f2f5', text: '#333', headerBg: '#4a90e2', headerText: '#ffffff',
    buttonBgPrimary: '#50c878', buttonBgSecondary: '#f5a623', buttonBgTertiary: '#8e44ad',
    buttonBgDanger: '#e74c3c', buttonBgLight: '#bdc3c7', inputBg: '#ffffff',
    inputBorder: '#ddd', logEntryBg: '#ffffff', logEntryBorder: '#eee',
    logTimestamp: '#2c3e50', logAction: '#555', logDetails: '#7f8c8d',
    cardBg: '#ffffff', cardBorder: '#eee', shadowColor: '#000',
    pickerBg: '#e0e0e0', pickerText: '#333', pickerSelectedBg: '#4a90e2',
    pickerSelectedText: '#ffffff', warningBg: '#fdf6e3', warningBorder: '#f7d794',
    warningText: '#d35400',
  },
  dark: {
    background: '#2c3e50', text: '#ecf0f1', headerBg: '#34495e', headerText: '#ffffff',
    buttonBgPrimary: '#27ae60', buttonBgSecondary: '#e67e22', buttonBgTertiary: '#9b59b6',
    buttonBgDanger: '#c0392b', buttonBgLight: '#7f8c8d', inputBg: '#34495e',
    inputBorder: '#555', logEntryBg: '#34495e', logEntryBorder: '#555',
    logTimestamp: '#ecf0f1', logAction: '#bdc3c7', logDetails: '#95a5a6',
    cardBg: '#34495e', cardBorder: '#555', shadowColor: '#000',
    pickerBg: '#555', pickerText: '#ecf0f1', pickerSelectedBg: '#4a90e2',
    pickerSelectedText: '#ffffff', warningBg: '#442b00', warningBorder: '#7a5200',
    warningText: '#ffcc80',
  },
  pastel: {
    background: '#fef7f9', text: '#4a2a4e', headerBg: '#e0b2d9', headerText: '#ffffff',
    buttonBgPrimary: '#a7d9b5', buttonBgSecondary: '#f7b7d3', buttonBgTertiary: '#c2a7d9',
    buttonBgDanger: '#f2a0a0', buttonBgLight: '#d9d9d9', inputBg: '#ffffff',
    inputBorder: '#e0e0e0', logEntryBg: '#ffffff', logEntryBorder: '#f0e0f5',
    logTimestamp: '#6a5a76', logAction: '#5d4c6b', logDetails: '#867b98',
    cardBg: '#ffffff', cardBorder: '#e0e0e0', shadowColor: '#b19cd9',
    pickerBg: '#e0e0e0', pickerText: '#4a2a4e', pickerSelectedBg: '#e0b2d9',
    pickerSelectedText: '#ffffff', warningBg: '#ffe0e6', warningBorder: '#fcc6d4',
    warningText: '#c45a7d',
  }
};

const getColors = (scheme) => COLOR_PALETTES[scheme];

// --- Helper Functions ---
const getItemKey = (category, brand, item) => `${category}_${brand}_${item}`;
const parseItemKey = (itemKey) => {
  const parts = itemKey.split('_');
  if (parts.length >= 3) {
    const category = parts[0];
    const brand = parts[1];
    const item = parts.slice(2).join('_');
    return { category, brand, item };
  }
  return { category: 'Unknown', brand: 'Unknown', item: itemKey };
};
const generateUniqueItemCode = (category, brand, item) => {
  const cleanAndTruncate = (str) => str.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
  const catPart = cleanAndTruncate(category);
  const brandPart = cleanAndTruncate(brand);
  const itemPart = cleanAndTruncate(item);
  const randomNum = Math.floor(Math.random() * 90000 + 10000).toString();
  return `${catPart}-${brandPart}-${itemPart}-${randomNum}`;
};
const getCategoryCode = (category) => {
  return category.replace(/[^a-zA-Z0-9]/g, '').substring(0, 3).toUpperCase();
};
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
  const [log, setLog] = useState([]);
  const [inventory, setInventory] = useState({});
  const [layawayItems, setLayawayItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cashierNumber, setCashierNumber] = useState('0');
  const [menuData, setMenuData] = useState(DEFAULT_MENUS);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [colorScheme, setColorScheme] = useState(DEFAULT_COLOR_SCHEME);
  const [lastCompletedSaleTotal, setLastCompletedSaleTotal] = useState(0);

  // --- File System Functions ---
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

  const getTodayLogFilePath = () => {
    const date = new Date();
    const fileName = `inventory_log_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.csv`;
    return LOG_DIRECTORY + fileName;
  };

  const loadLogFromFile = async () => {
    await ensureLogDirectoryExists();
    const filePath = getTodayLogFilePath();
    try {
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        await FileSystem.writeAsStringAsync(filePath, 'Timestamp,Action,Item Code,Category,Brand,Item,Quantity Change,New Quantity,Price Sold,Discount Applied\n');
        setLog([]);
      } else {
        const content = await FileSystem.readAsStringAsync(filePath);
        const lines = content.split('\n').filter(line => line.trim() !== '');
        if (lines.length > 0 && lines[0].startsWith('Timestamp,Action')) {
          lines.shift();
        }
        const parsedLog = lines.map(line => {
          const parts = line.split(',');
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
          return { raw: line };
        });
        setLog(parsedLog);
      }
    } catch (e) {
      console.error("Failed to load or create log file:", e);
      Alert.alert("Error", "Failed to load or create log file.");
      setLog([]);
    }
  };

  const saveLogToFile = async (currentLog) => {
    await ensureLogDirectoryExists();
    const filePath = getTodayLogFilePath();
    try {
      let csvContent = "Timestamp,Action,Item Code,Category,Brand,Item,Quantity Change,New Quantity,Price Sold,Discount Applied\n";
      currentLog.forEach(entry => {
        if (!entry.timestamp || !entry.action || !entry.itemCode || !entry.category || !entry.brand || !entry.item) {
          console.warn("Skipping malformed log entry during save:", entry);
          return;
        }

        const safeCategory = entry.category.includes(',') ? `"${entry.category}"` : entry.category;
        const safeBrand = entry.brand.includes(',') ? `"${entry.brand}"` : entry.brand;
        const safeItem = entry.item.includes(',') ? `"${entry.item}"` : entry.item;

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

  const loadInventory = async (currentMenuData) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(INVENTORY_FILE);
      let newInventory = {};

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(INVENTORY_FILE);
        newInventory = JSON.parse(content);
      }

      currentMenuData.categories.forEach(categoryObj => {
        if (categoryObj.name !== 'Clips, etc.' && categoryObj.name !== 'Other') {
          if (!newInventory[categoryObj.name]) {
            newInventory[categoryObj.name] = {};
          }
          categoryObj.brands.forEach(brandObj => {
            if (!newInventory[categoryObj.name][brandObj.name]) {
              newInventory[categoryObj.name][brandObj.name] = {};
            }
            brandObj.items.forEach(itemObj => {
              const itemName = itemObj.name;
              const itemPrice = itemObj.price !== undefined ? itemObj.price : DEFAULT_ITEM_PRICE;

                if (newInventory[categoryObj.name]?.[brandObj.name]?.[itemName]) {
                  let existingItem = newInventory[categoryObj.name][brandObj.name][itemName];
                  if (typeof existingItem.quantity !== 'number' || isNaN(existingItem.quantity)) {
                      existingItem.quantity = DEFAULT_ITEM_QUANTITY;
                      existingItem.lastChange = 'Quantity Corrected';
                      existingItem.lastChangeDate = new Date().toLocaleString();
                  }
                  if (existingItem.price === undefined) {
                      existingItem.price = itemPrice;
                  }
                } else {
                  newInventory[categoryObj.name][brandObj.name][itemName] = {
                    itemCode: generateUniqueItemCode(categoryObj.name, brandObj.name, itemName),
                    category: categoryObj.name,
                    brand: brandObj.name,
                    item: itemName,
                    quantity: DEFAULT_ITEM_QUANTITY,
                    price: itemPrice,
                    lastChange: 'Initial',
                    lastChangeDate: new Date().toLocaleString()
                  };
                }
            });
          });
        }
      });

      const cleanedInventory = {};
      currentMenuData.categories.forEach(categoryObj => {
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

      setInventory(cleanedInventory);
      await saveInventory(cleanedInventory);

    } catch (e) {
      console.error("Failed to load inventory:", e);
      Alert.alert("Error", "Failed to load inventory data. Initializing defaults.");
      let defaultInventory = {};
      DEFAULT_MENUS.categories.forEach(categoryObj => {
        if (categoryObj.name !== 'Clips, etc.' && categoryObj.name !== 'Other') {
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

  const saveInventory = async (currentInventory) => {
    try {
      await FileSystem.writeAsStringAsync(INVENTORY_FILE, JSON.stringify(currentInventory, null, 2));
    } catch (e) {
      console.error("Failed to save inventory:", e);
      Alert.alert("Error", "Failed to save inventory data.");
    }
  };

  const loadMenus = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(MENUS_FILE);
      let loadedMenuData = {};

      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(MENUS_FILE);
        loadedMenuData = JSON.parse(content);
      }

      if (!loadedMenuData || !loadedMenuData.categories || loadedMenuData.categories.length === 0) {
        loadedMenuData = DEFAULT_MENUS;
      }

      let clipsCategory = loadedMenuData.categories.find(cat => cat.name === 'Clips, etc.');
      if (!clipsCategory) {
        clipsCategory = { name: 'Clips, etc.', brands: [{ name: 'Fixed Prices', items: [] }] };
        loadedMenuData.categories.push(clipsCategory);
      }

      let fixedPricesBrand = clipsCategory.brands.find(brand => brand.name === 'Fixed Prices');
      if (!fixedPricesBrand) {
          fixedPricesBrand = { name: 'Fixed Prices', items: [] };
          clipsCategory.brands.push(fixedPricesBrand);
      }

      const fixedPrices = [
        2, 5, 10, 12, 14, 18, 20, 22, 25, 30,
        40, 50, 60, 70, 80, 90, 100, 110, 120, 130,
        140, 150, 160, 170, 180, 190, 200, 250
      ];
      fixedPricesBrand.items = [];
      fixedPrices.forEach(price => {
        const itemName = `$${price}.00`;
        fixedPricesBrand.items.push({ name: itemName, price: price });
      });


      setMenuData(loadedMenuData);
      await saveMenus(loadedMenuData);
      return loadedMenuData;
    } catch (e) {
      console.error("Failed to load menus:", e);
      Alert.alert("Error", "Failed to load menu data. Initializing defaults.");
      setMenuData(DEFAULT_MENUS);
      await saveMenus(DEFAULT_MENUS);
      return DEFAULT_MENUS;
    }
  };

  const saveMenus = async (currentMenuData) => {
    try {
      await FileSystem.writeAsStringAsync(MENUS_FILE, JSON.stringify(currentMenuData, null, 2));
    } catch (e) {
      console.error("Failed to save menus:", e);
      Alert.alert("Error", "Failed to save menu data.");
    }
  };

  const loadColorScheme = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(COLOR_SCHEME_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(COLOR_SCHEME_FILE);
        const scheme = JSON.parse(content);
        if (COLOR_PALETTES[scheme]) {
          setColorScheme(scheme);
        } else {
          setColorScheme(DEFAULT_COLOR_SCHEME);
        }
      } else {
        setColorScheme(DEFAULT_COLOR_SCHEME);
        await saveColorScheme(DEFAULT_COLOR_SCHEME);
      }
    } catch (e) {
      console.error("Failed to load color scheme:", e);
      Alert.alert("Error", "Failed to load color scheme. Using default.");
      setColorScheme(DEFAULT_COLOR_SCHEME);
    }
  };

  const saveColorScheme = async (scheme) => {
    try {
      await FileSystem.writeAsStringAsync(COLOR_SCHEME_FILE, JSON.stringify(scheme));
    } catch (e) {
      console.error("Failed to save color scheme:", e);
      Alert.alert("Error", "Failed to save color scheme.");
    }
  };

  const loadLayaway = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(LAYAWAY_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(LAYAWAY_FILE);
        setLayawayItems(JSON.parse(content));
      } else {
        setLayawayItems([]);
        await saveLayaway([]);
      }
    } catch (e) {
      console.error("Failed to load layaway items:", e);
      Alert.alert("Error", "Failed to load layaway items. Initializing empty list.");
      setLayawayItems([]);
    }
  };

  const saveLayaway = async (currentLayawayItems) => {
    try {
      await FileSystem.writeAsStringAsync(LAYAWAY_FILE, JSON.stringify(currentLayawayItems, null, 2));
    } catch (e) {
      console.error("Failed to save layaway items:", e);
      Alert.alert("Error", "Failed to save layaway items.");
    }
  };

  // --- Data Management Functions ---
  const addToLog = (action, itemCode, category, brand, item, quantityChange, newQuantity, priceSold = 'N/A', discountApplied = 'No') => {
    const timestamp = new Date().toLocaleString();
    const newEntry = {
      timestamp, action, itemCode, category, brand, item, quantityChange, newQuantity, priceSold: priceSold, discountApplied
    };
    setLog(prevLog => {
      const updatedLog = [...prevLog, newEntry];
      saveLogToFile(updatedLog);
      return updatedLog;
    });
  };

  const updateInventory = (category, brand, item, updatedItemData) => {
    if (category === 'Clips, etc.' || category === 'Other') {
      return;
    }

    setInventory(prevInventory => {
      const newInventory = { ...prevInventory };
      if (!newInventory[category]) newInventory[category] = {};
      if (!newInventory[category][brand]) newInventory[category][brand] = {};
      newInventory[category][brand][item] = updatedItemData;
      saveInventory(newInventory);
      return newInventory;
    });
  };

  // --- Initial Load Effect ---
  useEffect(() => {
    const initializeAppData = async () => {
      await ensureLogDirectoryExists();
      await loadColorScheme();
      const loadedMenuResult = await loadMenus();
      await loadInventory(loadedMenuResult);
      await loadLayaway();
      await loadLogFromFile();
      setIsLoading(false);
    };
    initializeAppData();
  }, []);

  // --- Navigation Functions ---
  const showMainView = () => setCurrentView('main');
  const showLogView = () => setCurrentView('log');
  const showInventoryView = () => setCurrentView('inventory');
  const showFileManagementView = () => setCurrentView('file_management');
  const showDevelopmentView = () => setCurrentView('development');
  const showMenuManagementView = () => setCurrentView('menu_management');
  const showLayawayManagementView = () => setCurrentView('layaway_management');

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
              setLog([]);
              setInventory({});
              setLayawayItems([]);
              setMenuData(DEFAULT_MENUS);
              setCashierNumber('0');
              setColorScheme(DEFAULT_COLOR_SCHEME);
              setLastCompletedSaleTotal(0);

              await FileSystem.deleteAsync(INVENTORY_FILE, { idempotent: true });
              await FileSystem.deleteAsync(MENUS_FILE, { idempotent: true });
              await FileSystem.deleteAsync(COLOR_SCHEME_FILE, { idempotent: true });
              await FileSystem.deleteAsync(CONFIG_BACKUP_FILE, { idempotent: true });
              await FileSystem.deleteAsync(LAYAWAY_FILE, { idempotent: true });
              const files = await FileSystem.readDirectoryAsync(LOG_DIRECTORY);
              for (const file of files) {
                await FileSystem.deleteAsync(LOG_DIRECTORY + file, { idempotent: true });
              }

              await saveMenus(DEFAULT_MENUS);
              await loadInventory(DEFAULT_MENUS);
              await saveLayaway([]);
              await loadLogFromFile();
              await saveColorScheme(DEFAULT_COLOR_SCHEME);

              Alert.alert("Success", "All data has been reset and re-initialized.");
            } catch (e) {
              console.error("Failed to reset data:", e);
              Alert.alert("Error", "Failed to reset data.");
            } finally {
              setIsLoading(false);
              showMainView();
            }
          }
        }
      ]
    );
  };

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
      const layawayContent = await FileSystem.readAsStringAsync(LAYAWAY_FILE);

      const configData = {
        menus: JSON.parse(menuContent),
        inventory: JSON.parse(inventoryContent),
        layaway: JSON.parse(layawayContent)
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
      "Are you sure you want to import configuration data? This will OVERWRITE your current menus, inventory, and layaway items. To import, you must first manually place the 'inventory_config_backup.json' file into this app's documents folder on your device.",
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

              if (configData.menus && configData.inventory && configData.layaway) {
                setMenuData(configData.menus);
                setInventory(configData.inventory);
                setLayawayItems(configData.layaway);
                await saveMenus(configData.menus);
                await saveInventory(configData.inventory);
                await saveLayaway(configData.layaway);
                Alert.alert("Import Successful", "Configuration data imported successfully.");
              } else {
                Alert.alert("Import Failed", "Invalid configuration file format. Please ensure the JSON contains 'menus', 'inventory', and 'layaway' keys.");
              }
            } catch (e) {
              console.error("Failed to import config:", e);
              Alert.alert("Import Failed", "Could not import configuration data. Please check the file format and ensure it is a valid JSON.");
            } finally {
              setIsLoading(false);
              showMainView();
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

  const colors = getColors(colorScheme);

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
          showMenuManagementView={showMenuManagementView}
          showLayawayManagementView={showLayawayManagementView}
          menuData={menuData}
          colors={colors}
          setInventory={setInventory}
          saveInventory={saveInventory}
          saveMenus={saveMenus}
          setMenuData={setMenuData}
          setLastCompletedSaleTotal={setLastCompletedSaleTotal}
          layawayItems={layawayItems}
          setLayawayItems={setLayawayItems}
          saveLayaway={saveLayaway}
        />
      ) : currentView === 'log' ? (
        <LogScreen
          log={log}
          showMainView={showMainView}
          showFileManagementView={showFileManagementView}
          colors={colors}
          lastCompletedSaleTotal={lastCompletedSaleTotal}
        />
      ) : currentView === 'inventory' ? (
        <InventoryManagementScreen
          inventory={inventory}
          updateInventory={updateInventory}
          addToLog={addToLog}
          showMainView={showMainView}
          menuData={menuData}
          colors={colors}
        />
      ) : currentView === 'file_management' ? (
        <FileManagementScreen showLogView={showLogView} colors={colors} />
      ) : currentView === 'development' ? (
        <DevelopmentScreen
          resetAppData={resetAppData}
          showMainView={showMainView}
          cashierNumber={cashierNumber}
          setCashierNumber={setCashierNumber}
          colorScheme={colorScheme}
          setColorScheme={setColorScheme}
          saveColorScheme={saveColorScheme}
          showMenuManagementView={showMenuManagementView}
          populateExampleItems={populateExampleItems}
          exportConfig={exportConfig}
          importConfig={importConfig}
          isEditModeEnabled={isEditModeEnabled}
          colors={colors}
        />
      ) : currentView === 'menu_management' ? (
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
          colors={colors}
        />
      ) : currentView === 'layaway_management' ? (
        <LayawayManagementScreen
          layawayItems={layawayItems}
          setLayawayItems={setLayawayItems}
          saveLayaway={saveLayaway}
          inventory={inventory}
          setInventory={setInventory}
          saveInventory={saveInventory}
          addToLog={addToLog}
          showMainView={showMainView}
          colors={colors}
        />
      ) : null}
    </SafeAreaView>
  );
};

// --- Discount Modal Component ---
const DiscountModal = ({ isVisible, onClose, onSelectDiscount, onManualDiscount, onGoBack, onCancelSale, itemDetails, colors }) => {
  const [manualPercentage, setManualPercentage] = useState('');

  // Reset manual percentage when modal opens for a new item
  useEffect(() => {
    if (isVisible) {
      setManualPercentage('');
    }
  }, [isVisible, itemDetails]);

  const handleManualDiscountSubmit = () => {
    const percentage = parseFloat(manualPercentage);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      onManualDiscount(percentage);
      onClose(); // Close modal after applying
    } else {
      Alert.alert("Invalid Input", "Please enter a valid percentage between 0 and 100.");
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Price Adjustment</Text>
          <Text style={[styles.modalSubtitle, { color: colors.text }]}>
            Choose an option for "{itemDetails.item}" (Current: ${itemDetails.currentPrice.toFixed(2)})
          </Text>

          <View style={styles.modalButtonGrid}>
            {[10, 15, 30, 40, 60].map(discount => (
              <TouchableOpacity
                key={`${discount}%`}
                style={[styles.modalButton, { backgroundColor: colors.buttonBgPrimary }]}
                onPress={() => {
                  onSelectDiscount(discount);
                  onClose();
                }}
              >
                <Text style={[styles.buttonText, { color: colors.headerText }]}>Apply {discount}% Discount</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.modalSubtitle, { color: colors.text, marginTop: 20 }]}>Manual Discount:</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Enter % (e.g., 25)"
            placeholderTextColor={colors.logDetails}
            keyboardType="numeric"
            value={manualPercentage}
            onChangeText={setManualPercentage}
          />
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.buttonBgSecondary, width: '100%' }]}
            onPress={handleManualDiscountSubmit}
          >
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Apply Manual Discount</Text>
          </TouchableOpacity>

          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgTertiary }]}
              onPress={() => {
                onGoBack();
                onClose();
              }}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgDanger }]}
              onPress={() => {
                onCancelSale();
                onClose();
              }}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel Sale</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


// --- Main Screen Component ---
const MainScreen = ({ addToLog, inventory, updateInventory, showLogView, showInventoryView, showMenuManagementView, showLayawayManagementView, menuData, colors, setInventory, saveInventory, saveMenus, setMenuData, setLastCompletedSaleTotal, layawayItems, setLayawayItems, saveLayaway }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [customItemInput, setCustomItemInput] = useState('');
  const [customItemPriceInput, setCustomItemPriceInput] = useState(String(DEFAULT_ITEM_PRICE.toFixed(2)));
  const [searchTerm, setSearchTerm] = useState('');
  const [allSearchableItems, setAllSearchableItems] = useState([]);
  const [currentSaleTotal, setCurrentSaleTotal] = useState(0);
  const [currentSaleItems, setCurrentSaleItems] = useState([]);
  const [isClipAdjustmentMode, setIsClipAdjustmentMode] = useState(false);

  // New states for the custom discount modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountModalProps, setDiscountModalProps] = useState({
    category: '', brand: '', item: '', currentPrice: 0, noInventoryUpdate: false, passedItemData: null
  });

  useEffect(() => {
    const flattenedItems = [];
    menuData.categories.forEach(categoryObj => {
      categoryObj.brands.forEach(brandObj => {
        brandObj.items.forEach(itemObj => {
          if (categoryObj.name === 'Clips, etc.') {
            flattenedItems.push({
              itemCode: generateUniqueItemCode(categoryObj.name, brandObj.name, itemObj.name),
              category: categoryObj.name,
              brand: brandObj.name,
              item: itemObj.name,
              quantity: 'N/A',
              price: itemObj.price,
              displayPath: `${categoryObj.name} > ${itemObj.name}`
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

    const otherCategory = menuData.categories.find(cat => cat.name === 'Other');
    if (otherCategory) {
      const customBrand = otherCategory.brands.find(brand => brand.name === 'Custom');
      if (customBrand) {
        customBrand.items.forEach(itemObj => {
          flattenedItems.push({
            itemCode: generateUniqueItemCode('Other', 'Custom', itemObj.name),
            category: 'Other',
            brand: 'Custom',
            item: itemObj.name,
            quantity: 'N/A',
            price: itemObj.price,
            displayPath: `Other > Custom > ${itemObj.name}`
          });
        });
      }
    }
    setAllSearchableItems(flattenedItems);
  }, [inventory, menuData]);


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
    ? currentBrandObj.items.filter(itemObj =>
        itemObj.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const globallyFilteredItems = allSearchableItems.filter(item =>
    item.displayPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.item.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    setSelectedBrand(null);
    setSearchTerm('');
    setIsClipAdjustmentMode(false);
  };

  const handleBrandSelect = (brandName) => {
    setSelectedBrand(brandName);
    setSearchTerm('');
  };

  const handleItemClickForSale = (category, brand, item) => {
    let itemData = inventory[category]?.[brand]?.[item];
    let priceToUse = itemData?.price;

    if (!itemData || category === 'Clips, etc.' || category === 'Other') {
      if (category === 'Clips, etc.') {
        const categoryObj = menuData.categories.find(c => c.name === category);
        const menuItem = categoryObj?.brands.find(b => b.name === 'Fixed Prices')?.items.find(i => i.name === item);
        if (menuItem) {
          priceToUse = menuItem.price;
          const tempItemData = {
            itemCode: generateUniqueItemCode(category, brand, item),
            category: category,
            brand: brand,
            item: item,
            quantity: 'N/A',
            price: priceToUse,
          };
          if (isClipAdjustmentMode) {
            // Show custom discount modal
            setDiscountModalProps({ category, brand, item, currentPrice: priceToUse, noInventoryUpdate: true, passedItemData: tempItemData });
            setShowDiscountModal(true);
          } else {
            handleLogSale(category, brand, item, priceToUse, 'No', true, tempItemData);
          }
        } else {
          Alert.alert("Error", "Clip item not found in menu data.");
        }
        return;
      } else if (category === 'Other') {
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
            quantity: 'N/A',
            price: priceToUse,
          };
          handleLogSale(category, brand, item, priceToUse, 'No', true, tempItemData);
        } else {
          Alert.alert("Error", "Custom 'Other' item not found in menu data.");
        }
        return;
      } else {
        Alert.prompt(
          "Set Price for New Item",
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
        return;
      }
    }

    const currentItemPrice = (typeof itemData.price === 'number' && !isNaN(itemData.price)) ? itemData.price : DEFAULT_ITEM_PRICE;

    if (itemData.quantity <= 0) {
      Alert.alert(
        "Warning: Out of Stock",
        `${category} - ${brand} - ${item} is out of stock. Do you still want to sell it (allowing negative inventory)?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sell Anyway",
            onPress: () => {
              Alert.alert(
                "Confirm Sale",
                `Sell "${item}" for $${currentItemPrice.toFixed(2)}?`,
                [
                  {
                    text: "Sell at Full Price",
                    onPress: () => handleLogSale(category, brand, item, currentItemPrice, 'No'),
                  },
                  {
                    text: "Adjust Price / Discount",
                    onPress: () => {
                      setDiscountModalProps({ category, brand, item, currentPrice: currentItemPrice, noInventoryUpdate: false, passedItemData: itemData });
                      setShowDiscountModal(true);
                    },
                  },
                  {
                    text: "Layaway (30% Down)",
                    onPress: () => handleLayawayItem(category, brand, item, currentItemPrice),
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
      return;
    }

    Alert.alert(
      "Confirm Sale",
      `Sell "${item}" for $${currentItemPrice.toFixed(2)}?`,
      [
        {
          text: "Sell at Full Price",
          onPress: () => handleLogSale(category, brand, item, currentItemPrice, 'No'),
        },
        {
          text: "Adjust Price / Discount",
          onPress: () => {
            setDiscountModalProps({ category, brand, item, currentPrice: currentItemPrice, noInventoryUpdate: false, passedItemData: itemData });
            setShowDiscountModal(true);
          },
        },
        {
          text: "Layaway (30% Down)",
          onPress: () => handleLayawayItem(category, brand, item, currentItemPrice),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  // This function will now be called by the DiscountModal
  const handleApplyDiscount = (discountPercentage) => {
    const { category, brand, item, currentPrice, noInventoryUpdate, passedItemData } = discountModalProps;
    const discountedPrice = currentPrice * (1 - (discountPercentage / 100));
    const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
    handleLogSale(category, brand, item, discountedPrice, `${discountPercentage}% Discount`, noInventoryUpdate, tempItemData);
    setIsClipAdjustmentMode(false); // Ensure clip adjustment mode is off
  };

  // This function will be called by the DiscountModal for manual input
  const handleApplyManualDiscount = (percentage) => {
    const { category, brand, item, currentPrice, noInventoryUpdate, passedItemData } = discountModalProps;
    const discountedPrice = currentPrice * (1 - (percentage / 100));
    const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
    handleLogSale(category, brand, item, discountedPrice, `${percentage}% Discount`, noInventoryUpdate, tempItemData);
    setIsClipAdjustmentMode(false); // Ensure clip adjustment mode is off
  };

  // This function will be called by the DiscountModal's "Back" button
  const handleDiscountModalBack = () => {
    const { category, brand, item } = discountModalProps;
    handleItemClickForSale(category, brand, item); // Re-show the "Confirm Sale" prompt
    setIsClipAdjustmentMode(false); // Exit clip adjustment mode
  };

  // This function will be called by the DiscountModal's "Cancel Sale" button
  const handleDiscountModalCancelSale = () => {
    // No action needed here, as the modal's onClose will handle closing, and the sale is cancelled
    // by the user choosing this option. The actual sale cancellation logic is in handleCancelSale.
    setIsClipAdjustmentMode(false); // Exit clip adjustment mode
  };

  const handleLogSale = (category, brand, item, priceSold, discountApplied, noInventoryUpdate = false, passedItemData = null) => {
    const itemData = passedItemData || inventory[category]?.[brand]?.[item];

    if (!itemData) {
      console.error("Error: itemData is undefined in handleLogSale for", category, brand, item);
      Alert.alert("Error", "Could not log sale due to missing item data. Please try again.");
      return;
    }

    const saleItem = {
      saleItemId: Date.now() + Math.random(),
      category,
      brand,
      item,
      itemCode: itemData.itemCode || generateUniqueItemCode(category, brand, item),
      priceSold,
      discountApplied,
      isInventoryTracked: category !== 'Clips, etc.' && category !== 'Other',
      originalQuantityChange: noInventoryUpdate ? 0 : -1,
      isLayawayDownPayment: false,
    };
    setCurrentSaleItems(prevItems => [...prevItems, saleItem]);
    setCurrentSaleTotal(prevTotal => prevTotal + priceSold);

    if (!noInventoryUpdate && saleItem.isInventoryTracked) {
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
      const itemCode = itemData.itemCode || generateUniqueItemCode(category, brand, item);
      addToLog("Sold Item (No Inventory Track)", itemCode, category, brand, item, 'N/A', 'N/A', priceSold, discountApplied);
    }

    setSelectedCategory(null);
    setSelectedBrand(null);
    setCustomItemInput('');
    setSearchTerm('');
  };

  const handleLayawayItem = (category, brand, item, originalPrice) => {
    const itemData = inventory[category]?.[brand]?.[item];

    if (!itemData) {
      console.error("Error: itemData is undefined in handleLayawayItem for", category, brand, item);
      Alert.alert("Error", "Could not place item on layaway due to missing item data. Please try again.");
      return;
    }

    const downPayment = originalPrice * 0.30;
    const remainingBalance = originalPrice - downPayment;

    const layawayEntry = {
      layawayId: Date.now() + Math.random(),
      itemCode: itemData.itemCode,
      category: category,
      brand: brand,
      item: item,
      originalPrice: originalPrice,
      amountPaid: downPayment,
      remainingBalance: remainingBalance,
      layawayDate: new Date().toLocaleString(),
      isInventoryTracked: category !== 'Clips, etc.' && category !== 'Other',
    };

    setLayawayItems(prevItems => {
      const updatedLayawayItems = [...prevItems, layawayEntry];
      saveLayaway(updatedLayawayItems);
      return updatedLayawayItems;
    });

    const saleItem = {
      saleItemId: Date.now() + Math.random(),
      category,
      brand,
      item,
      itemCode: itemData.itemCode,
      priceSold: downPayment,
      discountApplied: 'Layaway 30% Down',
      isInventoryTracked: false,
      originalQuantityChange: 0,
      isLayawayDownPayment: true,
      layawayId: layawayEntry.layawayId,
    };
    setCurrentSaleItems(prevItems => [...prevItems, saleItem]);
    setCurrentSaleTotal(prevTotal => prevTotal + downPayment);


    if (layawayEntry.isInventoryTracked) {
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
      addToLog("Layaway Started", itemData.itemCode, category, brand, item, quantityChange, newQuantity, downPayment, '30% Down');
    } else {
      addToLog("Layaway Started (No Inventory Track)", itemData.itemCode, item.category, item.brand, item.item, 'N/A', 'N/A', downPayment, '30% Down');
    }

    Alert.alert(
      "Layaway Initiated",
      `${item} placed on layaway. Down payment: $${downPayment.toFixed(2)}. Remaining: $${remainingBalance.toFixed(2)}.`
    );

    setSelectedCategory(null);
    setSelectedBrand(null);
    setCustomItemInput('');
    setSearchTerm('');
  };

  const handleUndoLastSaleItem = () => {
    if (currentSaleItems.length === 0) {
      Alert.alert("No Items", "There are no items in the current sale to undo.");
      return;
    }

    Alert.alert(
      "Undo Last Item",
      "Are you sure you want to remove the last item from the sale and revert inventory (if applicable)?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Undo",
          onPress: () => {
            setCurrentSaleItems(prevItems => {
              const lastItem = prevItems[prevItems.length - 1];
              if (!lastItem) return prevItems;

              if (lastItem.isLayawayDownPayment) {
                setCurrentSaleTotal(prevTotal => prevTotal - lastItem.priceSold);
                addToLog("Layaway Down Payment Undone (Sale)", lastItem.itemCode, lastItem.category, lastItem.brand, lastItem.item, 'N/A', 'N/A', lastItem.priceSold, lastItem.discountApplied);
              }
              else if (lastItem.isInventoryTracked) {
                const itemData = inventory[lastItem.category]?.[lastItem.brand]?.[lastItem.item];
                if (itemData) {
                  const newQuantity = itemData.quantity - lastItem.originalQuantityChange;
                  updateInventory(lastItem.category, lastItem.brand, lastItem.item, {
                    ...itemData,
                    quantity: newQuantity,
                    lastChange: `Removed from Sale (+${-lastItem.originalQuantityChange})`,
                    lastChangeDate: new Date().toLocaleString()
                  });
                  addToLog("Removed from Sale", lastItem.itemCode, lastItem.category, lastItem.brand, lastItem.item, -lastItem.originalQuantityChange, newQuantity, lastItem.priceSold, lastItem.discountApplied);
                }
              } else {
                addToLog("Removed from Sale (No Inventory Revert)", lastItem.itemCode, lastItem.category, lastItem.brand, lastItem.item, 'N/A', 'N/A', lastItem.priceSold, lastItem.discountApplied);
              }

              if (!lastItem.isLayawayDownPayment) {
                setCurrentSaleTotal(prevTotal => prevTotal - lastItem.priceSold);
              }
              return prevItems.slice(0, -1);
            });
          }
        }
      ]
    );
  };

  const handleEndSale = () => {
    Alert.alert(
      "Sale Complete",
      `Total for this sale: $${currentSaleTotal.toFixed(2)}`,
      [{ text: "OK", onPress: () => {
        setLastCompletedSaleTotal(currentSaleTotal);
        setCurrentSaleTotal(0);
        setCurrentSaleItems([]);
      } }]
    );
  };

  const handleCancelSale = () => {
    Alert.alert(
      "Cancel Sale",
      "Are you sure you want to cancel the current sale? This will clear the total and revert inventory (if applicable). Layaway items will remain on layaway.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            currentSaleItems.forEach(itemToRemove => {
                if (itemToRemove.isInventoryTracked && !itemToRemove.isLayawayDownPayment) {
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
            setLastCompletedSaleTotal(0);
            setCurrentSaleTotal(0);
            setCurrentSaleItems([]);
          }
        }
      ]
    );
  };

  const handleCustomItemSubmit = () => {
    if (customItemInput.trim() === '') {
      Alert.alert("Input Required", "Please enter an item name.");
      return;
    }
    const customItemName = customItemInput.trim();
    const price = parseFloat(customItemPriceInput);
    if (isNaN(price) || price < 0) {
      Alert.alert("Invalid Price", "Please enter a valid positive number for the price.");
      return;
    }

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
                    if (brand.items.some(itemObj => itemObj.name === customItemName)) {
                        Alert.alert("Duplicate Item", `Item "${customItemName}" already exists in ${targetCategory} > ${targetBrand}.`);
                        return brand;
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

    const finalMenuData = { ...menuData, categories: updatedCategories };
    setMenuData(finalMenuData);
    saveMenus(finalMenuData);

    const newItemData = {
      itemCode: generateUniqueItemCode(targetCategory, targetBrand, customItemName),
      category: targetCategory,
      brand: targetBrand,
      item: customItemName,
      quantity: 'N/A',
      price: price,
      lastChange: 'Initial (Custom Item)',
      lastChangeDate: new Date().toLocaleString()
    };

    handleLogSale(targetCategory, targetBrand, customItemName, price, 'No', true, newItemData);
    setCustomItemInput('');
    setCustomItemPriceInput(String(DEFAULT_ITEM_PRICE.toFixed(2)));
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
        <ScrollView style={styles.selectionScrollView}>
          <Text style={[styles.title, { color: colors.text }]}>Search Results</Text>
          <View style={styles.buttonGrid}>
            {globallyFilteredItems.length > 0 ? (
              globallyFilteredItems.map((itemData) => (
                <TouchableOpacity
                  key={itemData.itemCode}
                  style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }]}
                  onPress={() => handleItemClickForSale(itemData.category, itemData.brand, itemData.item)}>
                  <Text style={[styles.buttonText, { color: colors.text }]}>
                    {itemData.category === 'Clips, etc.' || itemData.category === 'Other' ? `${itemData.item}` : itemData.item}
                  </Text>
                  <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>
                    {itemData.category === 'Clips, etc.' ? `Fixed Price` : itemData.displayPath}
                  </Text>
                  <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>Code: {itemData.itemCode}</Text>
                  {(itemData.category !== 'Clips, etc.' && itemData.category !== 'Other') && (
                    <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>
                      Price: ${ (typeof itemData.price === 'number' && !isNaN(itemData.price)) ? itemData.price.toFixed(2) : 'N/A' }
                    </Text>
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
          <TextInput
            style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="e.g., 25.00"
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
        <>
          {!selectedCategory ? (
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
            <ScrollView style={styles.selectionScrollView}>
              <Text style={[styles.title, { color: colors.text }]}>Fixed Price Options for Clips, etc.</Text>
              <View style={styles.buttonGrid}>
                {menuData.categories.find(c => c.name === 'Clips, etc.')?.brands.find(b => b.name === 'Fixed Prices')?.items.map((itemObj) => (
                  <TouchableOpacity
                    key={itemObj.name}
                    style={[
                      styles.button,
                      { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor },
                      isClipAdjustmentMode && { borderColor: colors.buttonBgSecondary, borderWidth: 2 }
                    ]}
                    onPress={() => handleItemClickForSale('Clips, etc.', 'Fixed Prices', itemObj.name)}>
                    <Text style={[styles.buttonText, { color: colors.text }]}>{itemObj.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: colors.buttonBgSecondary, marginTop: 15 },
                  isClipAdjustmentMode && { backgroundColor: colors.buttonBgPrimary }
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
            <ScrollView style={styles.selectionScrollView}>
              <Text style={[styles.title, { color: colors.text }]}>
                {selectedCategory === 'Other' ? 'Enter Custom Item for "Other"' : `3. Select an Item for ${selectedCategory} - ${selectedBrand}`}
              </Text>

              {selectedCategory !== 'Other' && (
                <View style={styles.buttonGrid}>
                  {filteredItems.map((itemObj) => {
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
                            <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>
                              Price: ${ (typeof itemData.price === 'number' && !isNaN(itemData.price)) ? itemData.price.toFixed(2) : 'N/A' }
                            </Text>
                          </>
                        ) : (
                          <Text style={[styles.itemCodeSmall, { color: colors.logDetails }]}>
                            Price: ${ (typeof itemData.price === 'number' && !isNaN(itemData.price)) ? itemData.price.toFixed(2) : 'N/A' }
                          </Text>
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
              <TextInput
                style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="e.g., 25.00"
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
                  setSelectedCategory(null);
                } else {
                  setSelectedBrand(null);
                }
              }}>
                <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back'}</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </>
      )}

      <View style={[styles.footer, { borderTopColor: colors.logEntryBorder, backgroundColor: colors.background }]}>
        {currentSaleTotal > 0 ? (
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
        ) : (
          <>
            <TouchableOpacity style={[styles.logButton, { backgroundColor: colors.buttonBgSecondary, flex: 1 }]} onPress={showLogView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Activity Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.inventoryButton, { backgroundColor: colors.buttonBgTertiary, flex: 1 }]} onPress={showInventoryView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Manage Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.layawayButton, { backgroundColor: colors.buttonBgTertiary, flex: 1 }]} onPress={showLayawayManagementView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Layaway</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Custom Discount Modal */}
      <DiscountModal
        isVisible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSelectDiscount={handleApplyDiscount}
        onManualDiscount={handleApplyManualDiscount}
        onGoBack={handleDiscountModalBack}
        onCancelSale={handleCancelSale} // Call MainScreen's handleCancelSale
        itemDetails={discountModalProps}
        colors={colors}
      />
    </View>
  );
};

// --- Log Screen Component ---
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
      <TouchableOpacity style={[styles.backButton, styles.largeBackButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showMainView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Main App'}</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} />
    </View>
  );
};

// --- Inventory Management Screen Component ---
const InventoryManagementScreen = ({ inventory, updateInventory, addToLog, showMainView, menuData, colors }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleAdjustQuantity = (category, brand, item, adjustment) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const currentQuantity = itemData.quantity;
    const newQuantity = currentQuantity + adjustment;
    const quantityChange = adjustment;
    const lastChange = `${quantityChange > 0 ? '+' : ''}${quantityChange}`;
    const lastChangeDate = new Date().toLocaleString();

    updateInventory(category, brand, item, {
      ...itemData,
      quantity: newQuantity,
      lastChange: lastChange,
      lastChangeDate: lastChangeDate
    });
    addToLog("Adjusted Inventory", itemData.itemCode, category, brand, item, quantityChange, newQuantity, itemData.price, 'No');
  };

  const handleManualQuantityChange = (category, brand, item, text) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const quantity = parseInt(text, 10);
    if (!isNaN(quantity)) {
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
      addToLog("Manually Set Inventory", itemData.itemCode, category, brand, item, lastChange, quantity, itemData.price, 'No');
    } else if (text === '') {
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
      addToLog("Price Updated", itemData.itemCode, category, brand, item, 'N/A', itemData.quantity, price, 'No');
    } else if (text === '') {
    } else {
      Alert.alert("Invalid Input", "Please enter a valid positive number for the price.");
    }
  };

  const filteredAndOrganizedInventory = menuData.categories
    .map(categoryObj => {
      if (categoryObj.name === 'Clips, etc.' || categoryObj.name === 'Other') {
        return { ...categoryObj, brands: [] };
      }

      const filteredBrands = categoryObj.brands
        .map(brandObj => {
          const filteredItems = brandObj.items
            .filter(itemObj => {
              const itemData = inventory[categoryObj.name]?.[brandObj.name]?.[itemObj.name];
              return itemData && (
                itemData.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                itemData.item.toLowerCase().includes(searchTerm.toLowerCase())
              );
            })
            .map(itemObj => inventory[categoryObj.name][brandObj.name][itemObj.name]);
          return { ...brandObj, items: filteredItems };
        })
        .filter(brandObj => brandObj.items.length > 0);
      return { ...categoryObj, brands: filteredBrands };
    })
    .filter(categoryObj => categoryObj.brands.length > 0);

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
      <View style={styles.bottomBuffer} />
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
      await FileSystem.makeDirectoryAsync(LOG_DIRECTORY, { intermediates: true });
      const files = await FileSystem.readDirectoryAsync(LOG_DIRECTORY);
      const sortedFiles = files
        .filter(file => file.startsWith('inventory_log_') && file.endsWith('.csv'))
        .sort((a, b) => b.localeCompare(a));
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

  const shareFile = async (filePath) => {
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

  const getTodayLogFilePathForDisplay = () => {
    const date = new Date();
    const fileName = `inventory_log_${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}.csv`;
    return LOG_DIRECTORY + fileName;
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
                  onPress={() => shareFile(LOG_DIRECTORY + fileName)}
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
      <View style={styles.bottomBuffer} />
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

            if (categoryName !== 'Clips, etc.' && categoryName !== 'Other') {
              setInventory(prevInventory => {
                const newInventory = { ...prevInventory };
                delete newInventory[categoryName];
                saveInventory(newInventory);
                return newInventory;
              });
            }
            addToLog("Menu Changed", "N/A", categoryName, "N/A", "N/A", "Category Deleted", "N/A", "N/A", "No");
            setSelectedCategoryForBrand(null);
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
              if ((categoryName === 'Clips, etc.' && brandName === 'Fixed Prices') || (categoryName === 'Other' && brandName === 'Custom')) {
                Alert.alert("Cannot Delete", "This brand is essential and cannot be deleted.");
                return;
              }

              const brand = category.brands.find(b => b.name === brandName);
              if (brand) {
                category.brands = category.brands.filter(b => b.name !== brandName);
                setMenuData(updatedMenuData);
                saveMenus(updatedMenuData);

                if (categoryName !== 'Clips, etc.' && categoryName !== 'Other') {
                  setInventory(prevInventory => {
                    const newInventory = { ...prevInventory };
                    if (newInventory[categoryName]) {
                      delete newInventory[categoryName][brandName];
                      if (Object.keys(newInventory[categoryName]).length === 0) {
                        delete newInventory[categoryName];
                      }
                    }
                    saveInventory(newInventory);
                    return newInventory;
                  });
                }
                addToLog("Menu Changed", "N/A", categoryName, brandName, "N/A", "Brand Deleted", "N/A", "N/A", "No");
                setSelectedBrandForItems(null);
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
        if (!brand.items.some(itemObj => itemObj.name === newItemInput.trim())) {
          brand.items.push({ name: newItemInput.trim(), price: itemPrice });
          setMenuData(updatedMenuData);
          saveMenus(updatedMenuData);

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
          setNewItemPriceInput(String(DEFAULT_ITEM_PRICE.toFixed(2)));
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
                if ((categoryName === 'Clips, etc.' && brandName === 'Fixed Prices') || (categoryName === 'Other' && brandName === 'Custom')) {
                  Alert.alert("Cannot Delete", "This item is essential and cannot be deleted manually.");
                  return;
                }

                brand.items = brand.items.filter(itemObj => itemObj.name !== itemName);
                setMenuData(updatedMenuData);
                saveMenus(updatedMenuData);

                if (categoryName !== 'Clips, etc.' && categoryName !== 'Other') {
                  setInventory(prevInventory => {
                    const newInventory = { ...prevInventory };
                    if (newInventory[categoryName]?.[brandName]?.[itemName]) {
                      delete newInventory[categoryName][brandName][itemName];
                      if (Object.keys(newInventory[categoryName][brandName]).length === 0) {
                        delete newInventory[categoryName][brandName];
                        if (Object.keys(newInventory[categoryName]).length === 0) {
                          delete newInventory[categoryName];
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

      <Text style={[styles.subtitle, { color: colors.text }]}>Manage Categories</Text>
      <View style={[styles.currentListDisplay, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
        <Text style={[styles.currentListText, { color: colors.text }]}>Current Categories:</Text>
        <View style={styles.listItemsContainer}>
          {availableCategories.length > 0 ? (
            availableCategories.map(cat => (
              <View key={cat} style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
                <Text style={[styles.listItemText, { color: colors.text }]}>{cat}</Text>
                {isEditModeEnabled && cat !== 'Other' && cat !== 'Clips, etc.' && (
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
                setSelectedBrandForItems(null);
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
                {isEditModeEnabled && !(selectedCategoryForBrand === 'Clips, etc.' && brandObj.name === 'Fixed Prices') && !(selectedCategoryForBrand === 'Other' && brandObj.name === 'Custom') && (
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
                  {isEditModeEnabled && !(selectedCategoryForBrand === 'Clips, etc.' && selectedBrandForItems === 'Fixed Prices') && !(selectedCategoryForBrand === 'Other' && selectedBrandForItems === 'Custom') && (
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
const DevelopmentScreen = ({ resetAppData, showMainView, cashierNumber, setCashierNumber, colorScheme, setColorScheme, saveColorScheme, showMenuManagementView, populateExampleItems, exportConfig, importConfig, isEditModeEnabled, colors }) => {
  const handleSetCashierNumber = () => {
    Alert.alert("Set Cashier Number", `Cashier number set to: ${cashierNumber}`);
  };

  const handleSetColorScheme = (scheme) => {
    setColorScheme(scheme);
    saveColorScheme(scheme);
  };

  return (
    <ScrollView style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Development Tools</Text>

      {!isEditModeEnabled && (
        <View style={[styles.editModeWarning, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
          <Text style={[styles.editModeWarningText, { color: colors.warningText }]}>
            Edit mode is currently disabled. Tap the <MaterialIcons name="lock" size={16} color={colors.warningText} /> icon in the top-left to enable editing to use these features.
          </Text>
        </View>
      )}

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
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor },
            colorScheme === 'pastel' && { backgroundColor: colors.pickerSelectedBg }
          ]}
          onPress={() => handleSetColorScheme('pastel')}>
          <Text style={[styles.buttonText, { color: colors.text }, colorScheme === 'pastel' && { color: colors.pickerSelectedText }]}>Pastel Mode</Text>
        </TouchableOpacity>
      </View>

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

      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary, marginTop: 20 }]} onPress={showMenuManagementView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Go to Menu Management</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary, marginTop: 10, opacity: isEditModeEnabled ? 1 : 0.5 }]}
        onPress={isEditModeEnabled ? populateExampleItems : null}
        disabled={!isEditModeEnabled}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Populate Example Items</Text>
      </TouchableOpacity>

      <Text style={[styles.subtitle, { color: colors.text }]}>Config Import/Export</Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary, marginTop: 10, opacity: isEditModeEnabled ? 1 : 0.5 }]}
        onPress={isEditModeEnabled ? exportConfig : null}
        disabled={!isEditModeEnabled}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Export Config JSON</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary, marginTop: 10, opacity: isEditModeEnabled ? 1 : 0.5 }]}
        onPress={isEditModeEnabled ? importConfig : null}
        disabled={!isEditModeEnabled}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Import Config JSON</Text>
      </TouchableOpacity>

      <View style={[styles.resetSection, { borderTopColor: colors.logEntryBorder }]}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.buttonBgDanger, opacity: isEditModeEnabled ? 1 : 0.5 }]}
          onPress={isEditModeEnabled ? resetAppData : null}
          disabled={!isEditModeEnabled}
        >
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

// --- Layaway Management Screen Component ---
const LayawayManagementScreen = ({ layawayItems, setLayawayItems, saveLayaway, inventory, setInventory, saveInventory, addToLog, showMainView, colors }) => {
  const [paymentInputs, setPaymentInputs] = useState({});

  useEffect(() => {
    const initialInputs = {};
    layawayItems.forEach(item => {
      initialInputs[item.layawayId] = '';
    });
    setPaymentInputs(initialInputs);
  }, [layawayItems]);

  const handlePaymentInputChange = (layawayId, text) => {
    setPaymentInputs(prev => ({ ...prev, [layawayId]: text }));
  };

  const handleApplyPayment = (layawayItem) => {
    const paymentAmount = parseFloat(paymentInputs[layawayItem.layawayId]);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive number for the payment.");
      return;
    }
    if (paymentAmount > layawayItem.remainingBalance) {
      Alert.alert("Payment Exceeds Balance", `Payment amount $${paymentAmount.toFixed(2)} exceeds remaining balance $${layawayItem.remainingBalance.toFixed(2)}. Please enter a valid amount.`);
      return;
    }

    const updatedLayawayItems = layawayItems.map(item => {
      if (item.layawayId === layawayItem.layawayId) {
        const newAmountPaid = item.amountPaid + paymentAmount;
        const newRemainingBalance = item.originalPrice - newAmountPaid;
        return {
          ...item,
          amountPaid: newAmountPaid,
          remainingBalance: newRemainingBalance,
        };
      }
      return item;
    });

    setLayawayItems(updatedLayawayItems);
    saveLayaway(updatedLayawayItems);
    addToLog("Layaway Payment", layawayItem.itemCode, layawayItem.category, layawayItem.brand, layawayItem.item, `+${paymentAmount.toFixed(2)}`, layawayItem.remainingBalance - paymentAmount, paymentAmount, 'Layaway Payment');
    setPaymentInputs(prev => ({ ...prev, [layawayItem.layawayId]: '' }));
    Alert.alert("Payment Applied", `Successfully applied $${paymentAmount.toFixed(2)} to ${layawayItem.item}.`);
  };

  const handleCompleteLayaway = (layawayItem) => {
    if (layawayItem.remainingBalance > 0) {
      Alert.alert("Outstanding Balance", `There is still a remaining balance of $${layawayItem.remainingBalance.toFixed(2)}. Please apply full payment before completing.`);
      return;
    }

    Alert.alert(
      "Complete Layaway",
      `Mark "${layawayItem.item}" as fully paid and remove from layaway?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            const updatedLayawayItems = layawayItems.filter(item => item.layawayId !== layawayItem.layawayId);
            setLayawayItems(updatedLayawayItems);
            saveLayaway(updatedLayawayItems);
            addToLog("Layaway Completed", layawayItem.itemCode, layawayItem.category, layawayItem.brand, layawayItem.item, 'N/A', 'N/A', layawayItem.originalPrice, 'Layaway Paid Off');
            Alert.alert("Layaway Completed", `${layawayItem.item} has been marked as paid off.`);
          }
        }
      ]
    );
  };

  const handleCancelLayaway = (layawayItem) => {
    Alert.alert(
      "Cancel Layaway",
      `Are you sure you want to cancel layaway for "${layawayItem.item}"? This will return the item to inventory.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          onPress: () => {
            const updatedLayawayItems = layawayItems.filter(item => item.layawayId !== layawayItem.layawayId);
            setLayawayItems(updatedLayawayItems);
            saveLayaway(updatedLayawayItems);

            if (layawayItem.isInventoryTracked) {
              setInventory(prevInventory => {
                const newInventory = { ...prevInventory };
                const category = layawayItem.category;
                const brand = layawayItem.brand;
                const item = layawayItem.item;

                if (!newInventory[category]) newInventory[category] = {};
                if (!newInventory[category][brand]) newInventory[category][brand] = {};

                const existingItem = newInventory[category][brand][item];
                if (existingItem) {
                  const newQuantity = existingItem.quantity + 1;
                  newInventory[category][brand][item] = {
                    ...existingItem,
                    quantity: newQuantity,
                    lastChange: 'Layaway Cancelled (+1)',
                    lastChangeDate: new Date().toLocaleString()
                  };
                  addToLog("Layaway Cancelled (Returned to Stock)", layawayItem.itemCode, category, brand, item, '+1', newQuantity, 'N/A', 'Layaway Cancelled');
                } else {
                  newInventory[category][brand][item] = {
                    itemCode: layawayItem.itemCode,
                    category: category,
                    brand: brand,
                    item: item,
                    quantity: 1,
                    price: layawayItem.originalPrice,
                    lastChange: 'Layaway Cancelled (Re-added)',
                    lastChangeDate: new Date().toLocaleString()
                  };
                  addToLog("Layaway Cancelled (Re-added to Stock)", layawayItem.itemCode, category, brand, item, '+1', 1, 'N/A', 'Layaway Cancelled');
                }
                saveInventory(newInventory);
                return newInventory;
              });
            } else {
              addToLog("Layaway Cancelled (Not Inventory Tracked)", layawayItem.itemCode, layawayItem.category, layawayItem.brand, layawayItem.item, 'N/A', 'N/A', 'N/A', 'Layaway Cancelled');
            }
            Alert.alert("Layaway Cancelled", `${layawayItem.item} has been removed from layaway and returned to inventory.`);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Layaway Management</Text>
      <ScrollView style={[styles.layawayListContainer, { backgroundColor: colors.cardBg }]}>
        {layawayItems.length === 0 ? (
          <Text style={[styles.logEntryText, { color: colors.text }]}>No items currently on layaway.</Text>
        ) : (
          layawayItems.map(item => (
            <View key={item.layawayId} style={[styles.layawayItemCard, { borderBottomColor: colors.logEntryBorder }]}>
              <Text style={[styles.layawayItemText, { color: colors.text }]}>
                {item.item} ({item.category} > {item.brand})
              </Text>
              <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Code: {item.itemCode}</Text>
              <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Original Price: ${item.originalPrice.toFixed(2)}</Text>
              <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Amount Paid: ${item.amountPaid.toFixed(2)}</Text>
              <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Remaining Balance: ${item.remainingBalance.toFixed(2)}</Text>
              <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Layaway Date: {item.layawayDate}</Text>

              <View style={styles.layawayPaymentControls}>
                <TextInput
                  style={[styles.layawayPaymentInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Payment Amount ($)"
                  placeholderTextColor={colors.logDetails}
                  keyboardType="numeric"
                  value={paymentInputs[item.layawayId]}
                  onChangeText={(text) => handlePaymentInputChange(item.layawayId, text)}
                />
                <TouchableOpacity
                  style={[styles.layawayActionButton, { backgroundColor: colors.buttonBgPrimary }]}
                  onPress={() => handleApplyPayment(item)}
                >
                  <Text style={[styles.buttonText, { color: colors.headerText }]}>Apply Payment</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.layawayActionButtons}>
                <TouchableOpacity
                  style={[styles.layawayActionButton, { backgroundColor: colors.buttonBgSecondary }]}
                  onPress={() => handleCompleteLayaway(item)}
                  disabled={item.remainingBalance > 0}
                >
                  <Text style={[styles.buttonText, { color: colors.headerText }]}>Complete Layaway</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.layawayActionButton, { backgroundColor: colors.buttonBgDanger }]}
                  onPress={() => handleCancelLayaway(item)}
                >
                  <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel Layaway</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={showMainView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Back to Main App</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} />
    </View>
  );
};


// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: Platform.OS === 'ios' ? 25 : 25,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  devButton: {
    position: 'absolute',
    right: 15,
    top: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  editModeButton: {
    position: 'absolute',
    left: 15,
    top: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 8,
    borderRadius: 5,
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  selectionScrollView: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 10,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemCodeSmall: {
    fontSize: 10,
    marginTop: 5,
  },
  input: {
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  searchInput: {
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  downloadInventoryButton: {
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 10,
  },
  largeBackButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
    minWidth: '80%',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    borderTopWidth: 1,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  logButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  inventoryButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
    marginRight: 5,
  },
  layawayButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  saleActionsContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  endSaleButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  editCancelButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  undoLastItemButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  cancelSaleButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  logContainer: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  logEntry: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 5,
  },
  logEntryText: {
    fontSize: 14,
  },
  logEntryTimestamp: {
    fontWeight: 'bold',
  },
  logEntryAction: {
    fontStyle: 'italic',
  },
  logEntryDetails: {
    fontSize: 12,
    marginLeft: 10,
  },
  inventoryListContainer: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  categoryHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
  },
  brandHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 10,
  },
  inventoryItem: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  inventoryItemDetails: {
    width: '100%',
    marginBottom: 10,
  },
  inventoryItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  inventoryItemCode: {
    fontSize: 12,
  },
  inventoryLastChange: {
    fontSize: 10,
    fontStyle: 'italic',
  },
  inventoryControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
  },
  inventoryButtonSmall: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    minWidth: 40,
    alignItems: 'center',
  },
  inventoryInput: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    minWidth: 50,
    textAlign: 'center',
    fontSize: 16,
    borderWidth: 1,
  },
  priceLabel: {
    fontSize: 16,
    marginLeft: 10,
    marginRight: 2,
  },
  priceInput: {
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 5,
    minWidth: 60,
    textAlign: 'center',
    fontSize: 16,
    borderWidth: 1,
  },
  sellButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
    alignItems: 'center',
  },
  fileListContainer: {
    flex: 1,
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
  },
  fileItemText: {
    fontSize: 14,
    flex: 1,
  },
  fileItemActions: {
    flexDirection: 'row',
  },
  smallActionButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 5,
  },
  smallButtonText: {
    fontSize: 12,
  },
  fileContentModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fileContentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  fileContentScroll: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    width: '100%',
    marginBottom: 20,
  },
  fileContentText: {
    fontSize: 14,
  },
  resetButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  resetWarningText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  resetSection: {
    marginTop: 30,
    borderTopWidth: 1,
    paddingTop: 20,
    alignItems: 'center',
  },
  currentListText: {
    fontSize: 14,
    marginBottom: 10,
    textAlign: 'center',
  },
  bottomBuffer: {
    height: Platform.OS === 'ios' ? 30 : 30,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  horizontalPicker: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingVertical: 5,
  },
  pickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginRight: 10,
  },
  pickerButtonSelected: {
  },
  pickerButtonText: {
    fontSize: 14,
  },
  pickerButtonTextSelected: {
    fontWeight: 'bold',
  },
  editModeWarning: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  editModeWarningText: {
    fontSize: 14,
    textAlign: 'center',
  },
  currentListDisplay: {
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
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
  },
  listItemText: {
    fontSize: 15,
    flex: 1,
  },
  deleteButton: {
    padding: 5,
    borderRadius: 5,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
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
    maxHeight: 150,
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
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%', // Ensure it takes full width of modal
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '48%', // Two buttons per row
    alignItems: 'center',
    marginBottom: 10,
  },
  modalInput: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
  },
  modalActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  modalActionButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  currentSaleTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
  },
  mostRecentSaleContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  mostRecentSaleText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  layawayListContainer: {
    flex: 1,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  layawayItemCard: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  layawayItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  layawayDetailsText: {
    fontSize: 13,
    marginBottom: 3,
  },
  layawayPaymentControls: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  layawayPaymentInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 10,
    fontSize: 15,
  },
  layawayActionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  layawayActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

export default App;
