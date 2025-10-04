import React, { useState, useEffect, useMemo } from 'react';
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
  Modal,
  KeyboardAvoidingView,
  FlatList,
  Switch,
} from 'react-native';
import *as FileSystem from 'expo-file-system';
import *as Sharing from 'expo-sharing';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

// --- File System Constants ---
const LOG_DIRECTORY = FileSystem.documentDirectory + 'inventory_logs/';
const INVENTORY_FILE = FileSystem.documentDirectory + 'inventory.json';
const MENUS_FILE = FileSystem.documentDirectory + 'menus.json';
const COLOR_SCHEME_FILE = FileSystem.documentDirectory + 'color_scheme.json';
const CONFIG_BACKUP_FILE = FileSystem.documentDirectory + 'inventory_config_backup.json';
const LAYAWAY_FILE = FileSystem.documentDirectory + 'layaway.json';
const TIMECLOCK_FILE = FileSystem.documentDirectory + 'timeclock_punches.json';
const CASHIERS_FILE = FileSystem.documentDirectory + 'cashiers.json'; // For cashier data
const APP_CONFIG_FILE = FileSystem.documentDirectory + 'app_config.json'; // For PSK and settings

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
const DEFAULT_APP_CONFIG = {
  psk: null,
  firstRun: true,
  allowPunchEditing: true,
  lockFeatureEnabled: false,
};

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
    background: '#fef7f9', text: '#4a2a4e', headerBg: '#e0b2d9', headerText: '#4a2a4e',
    buttonBgPrimary: '#a7d9b5', buttonBgSecondary: '#f7b7d3', buttonBgTertiary: '#c2a7d9',
    buttonBgDanger: '#f2a0a0', buttonBgLight: '#d9d9d9', inputBg: '#ffffff',
    inputBorder: '#e0e0e0', logEntryBg: '#ffffff', logEntryBorder: '#f0e0f5',
    logTimestamp: '#6a5a76', logAction: '#5d4c6b', logDetails: '#867b98',
    cardBg: '#ffffff', cardBorder: '#e0e0e0', shadowColor: '#b19cd9',
    pickerBg: '#e0e0e0', pickerText: '#4a2a4e', pickerSelectedBg: '#e0b2d9',
    pickerSelectedText: '#4a2a4e',
    warningBg: '#ffe0e6', warningBorder: '#fcc6d4',
    warningText: '#c45a7d',
  },
  christmas: {
    background: '#121212',
    text: '#f0f0f0',
    headerBg: '#B22222',
    headerText: '#ffffff',
    buttonBgPrimary: '#228B22',
    buttonBgSecondary: '#FFD700',
    buttonBgTertiary: '#808080',
    buttonBgDanger: '#DC143C',
    buttonBgLight: '#4a4a4a',
    inputBg: '#2c2c2c',
    inputBorder: '#555',
    logEntryBg: '#2c2c2c',
    logEntryBorder: '#444',
    logTimestamp: '#f0f0f0',
    logAction: '#cccccc',
    logDetails: '#a9a9a9',
    cardBg: '#2c2c2c',
    cardBorder: '#444',
    shadowColor: '#000',
    pickerBg: '#4a4a4a',
    pickerText: '#f0f0f0',
    pickerSelectedBg: '#228B22',
    pickerSelectedText: '#ffffff',
    warningBg: '#4d0000',
    warningBorder: '#990000',
    warningText: '#ffcccb',
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

const EXAMPLE_CASHIERS = [
  { name: 'Alice', code: '1001' },
  { name: 'Bob', code: '1002' },
  { name: 'Charlie', code: '1003' },
  { name: 'Diana', code: '1004' },
  { name: 'Edward', code: '1005' },
];

const EXAMPLE_PUNCHES = [
  // Alice's punches
  { id: `2023-10-26T09:00:00.000Z-1`, cashierCode: '1001', time: new Date(new Date().setDate(new Date().getDate() - 2)).setHours(9,0,0,0), type: 'IN' },
  { id: `2023-10-26T17:00:00.000Z-1`, cashierCode: '1001', time: new Date(new Date().setDate(new Date().getDate() - 2)).setHours(17,0,0,0), type: 'OUT' },
  { id: `2023-10-27T09:05:00.000Z-1`, cashierCode: '1001', time: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(9,5,0,0), type: 'IN' },
  { id: `2023-10-27T17:02:00.000Z-1`, cashierCode: '1001', time: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(17,2,0,0), type: 'OUT' },
  // Bob's punches
  { id: `2023-10-26T10:00:00.000Z-2`, cashierCode: '1002', time: new Date(new Date().setDate(new Date().getDate() - 2)).setHours(10,0,0,0), type: 'IN' },
  { id: `2023-10-26T15:30:00.000Z-2`, cashierCode: '1002', time: new Date(new Date().setDate(new Date().getDate() - 2)).setHours(15,30,0,0), type: 'OUT' },
];


// --- Main Application Component ---
const App = () => {
  const [currentView, setCurrentView] = useState('main');
  const [log, setLog] = useState([]);
  const [inventory, setInventory] = useState({});
  const [layawayItems, setLayawayItems] = useState([]);
  const [timeClockPunches, setTimeClockPunches] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [appConfig, setAppConfig] = useState(DEFAULT_APP_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [cashierNumber, setCashierNumber] = useState('0');
  const [menuData, setMenuData] = useState(DEFAULT_MENUS);
  const [isEditModeEnabled, setIsEditModeEnabled] = useState(false);
  const [colorScheme, setColorScheme] = useState(DEFAULT_COLOR_SCHEME);
  const [lastCompletedSaleTotal, setLastCompletedSaleTotal] = useState(0);

  // State for the current sale, lifted from MainScreen
  const [currentSaleTotal, setCurrentSaleTotal] = useState(0);
  const [currentSaleItems, setCurrentSaleItems] = useState([]);

  // New states for the custom discount modal
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountModalProps, setDiscountModalProps] = useState({
    category: '', brand: '', item: '', currentPrice: 0, noInventoryUpdate: false, passedItemData: null
  });

  // New states for the custom layaway input modal
  const [showLayawayInputModal, setShowLayawayInputModal] = useState(false);
  const [layawayInputModalProps, setLayawayInputModalProps] = useState(null);

  // PSK Modal states
  const [showPSKModal, setShowPSKModal] = useState(false);
  const [showPSKVerifyModal, setShowPSKVerifyModal] = useState(false);
  const [showPSKManageModal, setShowPSKManageModal] = useState(false);
  const [pskManageMode, setPskManageMode] = useState('set'); // 'set', 'change', or 'remove'


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
      let jsonContent;
      try {
        jsonContent = JSON.stringify(currentInventory, null, 2);
      } catch (jsonError) {
        console.error("Failed to stringify inventory JSON:", jsonError);
        Alert.alert("Error", "Failed to prepare inventory data for saving due to data format issue. Please check console for details.");
        return;
      }
      await FileSystem.writeAsStringAsync(INVENTORY_FILE, jsonContent);
    } catch (e) {
      console.error("Failed to save inventory:", e);
      Alert.alert("Error", "Failed to save inventory data. Details: " + e.message);
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

      let otherCategory = loadedMenuData.categories.find(cat => cat.name === 'Other');
      if (!otherCategory) {
        otherCategory = { name: 'Other', brands: [] };
        loadedMenuData.categories.push(otherCategory);
      }

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

  const loadTimeClockPunches = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(TIMECLOCK_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(TIMECLOCK_FILE);
        setTimeClockPunches(JSON.parse(content));
      } else {
        setTimeClockPunches([]);
        await saveTimeClockPunches([]);
      }
    } catch (e) {
      console.error("Failed to load time clock punches:", e);
      Alert.alert("Error", "Failed to load time clock data. Initializing empty list.");
      setTimeClockPunches([]);
    }
  };

  const saveTimeClockPunches = async (currentTimeClockPunches) => {
    try {
      await FileSystem.writeAsStringAsync(TIMECLOCK_FILE, JSON.stringify(currentTimeClockPunches, null, 2));
    } catch (e) {
      console.error("Failed to save time clock punches:", e);
      Alert.alert("Error", "Failed to save time clock data.");
    }
  };

  const loadCashiers = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(CASHIERS_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(CASHIERS_FILE);
        setCashiers(JSON.parse(content));
      } else {
        setCashiers([]);
        await saveCashiers([]);
      }
    } catch (e) {
      console.error("Failed to load cashiers:", e);
      Alert.alert("Error", "Failed to load cashier data.");
      setCashiers([]);
    }
  };

  const saveCashiers = async (currentCashiers) => {
    try {
      await FileSystem.writeAsStringAsync(CASHIERS_FILE, JSON.stringify(currentCashiers, null, 2));
    } catch (e) {
      console.error("Failed to save cashiers:", e);
      Alert.alert("Error", "Failed to save cashier data.");
    }
  };

  const loadAppConfig = async () => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(APP_CONFIG_FILE);
      if (fileInfo.exists) {
        const content = await FileSystem.readAsStringAsync(APP_CONFIG_FILE);
        const loadedConfig = JSON.parse(content);
        setAppConfig(prev => ({ ...prev, ...loadedConfig }));
        return loadedConfig;
      } else {
        setAppConfig(DEFAULT_APP_CONFIG);
        await saveAppConfig(DEFAULT_APP_CONFIG);
        return DEFAULT_APP_CONFIG;
      }
    } catch (e) {
      console.error("Failed to load app config:", e);
      Alert.alert("Error", "Failed to load app configuration.");
      setAppConfig(DEFAULT_APP_CONFIG);
      return DEFAULT_APP_CONFIG;
    }
  };

  const saveAppConfig = async (currentAppConfig) => {
    try {
      await FileSystem.writeAsStringAsync(APP_CONFIG_FILE, JSON.stringify(currentAppConfig, null, 2));
    } catch (e) {
      console.error("Failed to save app config:", e);
      Alert.alert("Error", "Failed to save app configuration.");
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

  const updateInventoryState = (category, brand, item, updatedItemData, currentInventory) => {
    if (category === 'Clips, etc.' || category === 'Other') {
      return currentInventory;
    }
    const newInventory = { ...currentInventory };
    if (!newInventory[category]) newInventory[category] = {};
    if (!newInventory[category][brand]) newInventory[category][brand] = {};
    newInventory[category][brand][item] = updatedItemData;
    return newInventory;
  };

  // --- Initial Load Effect ---
  useEffect(() => {
    const initializeAppData = async () => {
      await ensureLogDirectoryExists();
      await loadColorScheme();
      const loadedConfig = await loadAppConfig();
      if (loadedConfig.firstRun) {
        setShowPSKModal(true);
      }
      const loadedMenuResult = await loadMenus();
      await loadInventory(loadedMenuResult);
      await loadLayaway();
      await loadTimeClockPunches();
      await loadCashiers();
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
  const showTimeClockView = () => setCurrentView('time_clock');
  const showCashierManagementView = () => setCurrentView('cashier_management');
  const showTimeClockDevMenuView = () => setCurrentView('time_clock_dev_menu');
  const showPayrollSummaryView = () => setCurrentView('payroll_summary');

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
              setTimeClockPunches([]);
              setCashiers([]);
              setAppConfig(DEFAULT_APP_CONFIG);
              setMenuData(DEFAULT_MENUS);
              setCashierNumber('0');
              setColorScheme(DEFAULT_COLOR_SCHEME);
              setLastCompletedSaleTotal(0);
              setCurrentSaleItems([]);
              setCurrentSaleTotal(0);

              await FileSystem.deleteAsync(INVENTORY_FILE, { idempotent: true });
              await FileSystem.deleteAsync(MENUS_FILE, { idempotent: true });
              await FileSystem.deleteAsync(COLOR_SCHEME_FILE, { idempotent: true });
              await FileSystem.deleteAsync(LAYAWAY_FILE, { idempotent: true });
              await FileSystem.deleteAsync(TIMECLOCK_FILE, { idempotent: true });
              await FileSystem.deleteAsync(CASHIERS_FILE, { idempotent: true });
              await FileSystem.deleteAsync(APP_CONFIG_FILE, { idempotent: true });
              const files = await FileSystem.readDirectoryAsync(LOG_DIRECTORY);
              for (const file of files) {
                await FileSystem.deleteAsync(LOG_DIRECTORY + file, { idempotent: true });
              }

              await saveMenus(DEFAULT_MENUS);
              await loadInventory(DEFAULT_MENUS);
              await saveLayaway([]);
              await saveTimeClockPunches([]);
              await saveCashiers([]);
              await saveAppConfig(DEFAULT_APP_CONFIG);
              await loadLogFromFile();
              await saveColorScheme(DEFAULT_COLOR_SCHEME);

              Alert.alert("Success", "All data has been reset. PSK setup will run on next launch.");
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

  const populateExampleTimeData = async () => {
    Alert.alert(
      "Populate Example Time Data",
      "This will ERASE all current cashiers and time punches and replace them with example data. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Populate",
          onPress: async () => {
            try {
              setCashiers(EXAMPLE_CASHIERS);
              setTimeClockPunches(EXAMPLE_PUNCHES);
              await saveCashiers(EXAMPLE_CASHIERS);
              await saveTimeClockPunches(EXAMPLE_PUNCHES);
              Alert.alert("Success", "Example cashiers and time punches have been loaded.");
            } catch (e) {
              console.error("Failed to populate example time data:", e);
              Alert.alert("Error", "Could not load example time data.");
            }
          },
        },
      ]
    );
  };

  const clearAllPunchData = async () => {
    Alert.alert(
      "Clear All Punch Data",
      "Are you sure you want to permanently delete ALL time clock punches? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              setTimeClockPunches([]);
              await saveTimeClockPunches([]);
              Alert.alert("Success", "All time clock punch data has been deleted.");
            } catch (e) {
              console.error("Failed to clear punch data:", e);
              Alert.alert("Error", "Could not clear punch data.");
            }
          },
        },
      ]
    );
  };

  const exportConfig = async () => {
    try {
      const menuContent = await FileSystem.readAsStringAsync(MENUS_FILE);
      const inventoryContent = await FileSystem.readAsStringAsync(INVENTORY_FILE);
      const layawayContent = await FileSystem.readAsStringAsync(LAYAWAY_FILE);
      const cashiersContent = await FileSystem.readAsStringAsync(CASHIERS_FILE);
      const timeClockContent = await FileSystem.readAsStringAsync(TIMECLOCK_FILE);

      const configData = {
        menus: JSON.parse(menuContent),
        inventory: JSON.parse(inventoryContent),
        layaway: JSON.parse(layawayContent),
        cashiers: JSON.parse(cashiersContent),
        timeclock: JSON.parse(timeClockContent),
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
    try {
      // The type option correctly filters for JSON files.
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
      });

      // FIX: Handle the new response structure from DocumentPicker.
      // It no longer returns `type: 'success'`, but `canceled: false` and an `assets` array.
      if (!result.canceled && result.assets && result.assets.length > 0) {
        handleFileImport(result.assets[0].uri);
      }
    } catch (e) {
      console.error("Error picking document:", e);
      Alert.alert("Error", "Could not open document picker.");
    }
  };
  const handleFileImport = (fileUri) => {
    Alert.alert(
      "Confirm Import",
      `This will OVERWRITE your current configuration with the content of the selected file. This action cannot be undone. Are you sure you want to proceed?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Import",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const content = await FileSystem.readAsStringAsync(fileUri);
              const configData = JSON.parse(content);

              // Validate the structure of configData before proceeding
              const requiredKeys = ['menus', 'inventory', 'layaway', 'cashiers', 'timeclock'];
              const hasAllKeys = requiredKeys.every(key => key in configData);

              if (!hasAllKeys) {
                  Alert.alert("Import Failed", "The selected JSON file has an invalid format or is missing required data sections.");
                  setIsLoading(false);
                  return;
              }

              if (configData.menus) { setMenuData(configData.menus); await saveMenus(configData.menus); }
              if (configData.inventory) { setInventory(configData.inventory); await saveInventory(configData.inventory); }
              if (configData.layaway) { setLayawayItems(configData.layaway); await saveLayaway(configData.layaway); }
              if (configData.cashiers) { setCashiers(configData.cashiers); await saveCashiers(configData.cashiers); }
              if (configData.timeclock) { setTimeClockPunches(configData.timeclock); await saveTimeClockPunches(configData.timeclock); }

              Alert.alert("Import Successful", "Configuration data imported successfully.");

            } catch (e) {
              console.error("Failed to import config:", e);
              Alert.alert("Import Failed", "Could not import configuration data. Please ensure the file is a valid JSON configuration backup.");
            } finally {
              setIsLoading(false);
              showMainView();
            }
          }
        }
      ]
    );
  };
  const exportPunchesAsCsv = async () => {
    try {
      let csvContent = "Date,Time,Cashier Name,Cashier Code,Punch Type,Edited,Original Timestamp,Edit Reason\n";

      const sortedPunches = [...timeClockPunches].sort((a, b) => new Date(a.time) - new Date(b.time));

      sortedPunches.forEach(punch => {
        const punchDate = new Date(punch.time);
        const cashier = cashiers.find(c => c.code === punch.cashierCode);
        const cashierName = cashier ? cashier.name.replace(/,/g, '') : 'Unknown';
        const isEdited = punch.editReason ? 'Yes' : 'No';
        const originalTimestamp = isEdited ? new Date(punch.originalTime).toLocaleString() : 'N/A';
        const editReason = punch.editReason ? `"${punch.editReason.replace(/"/g, '""')}"` : 'N/A';

        csvContent += `${punchDate.toLocaleDateString()},${punchDate.toLocaleTimeString()},${cashierName},${punch.cashierCode},${punch.type},${isEdited},${originalTimestamp},${editReason}\n`;
      });

      const fileName = `time_punches_${new Date().toISOString().slice(0, 10)}.csv`;
      const filePath = FileSystem.documentDirectory + fileName;
      await FileSystem.writeAsStringAsync(filePath, csvContent);
      await Sharing.shareAsync(filePath);
      Alert.alert("Export Successful", `Time punch data exported to ${fileName}`);
    } catch (e) {
      console.error("Failed to export punches as CSV:", e);
      Alert.alert("Export Failed", "Could not export time punch data as CSV.");
    }
  };

  const handleAddLayawayPaymentToSale = (layawayItem, paymentAmount) => {
    const saleItem = {
      saleItemId: Date.now() + Math.random(),
      category: layawayItem.category,
      brand: layawayItem.brand,
      item: layawayItem.item,
      itemCode: layawayItem.itemCode,
      priceSold: paymentAmount,
      discountApplied: 'Layaway Payment',
      isInventoryTracked: false,
      originalQuantityChange: 0,
      isLayawayDownPayment: false,
      isLayawayPayment: true,
      isLayawayFinalSale: false,
      layawayId: layawayItem.layawayId,
    };
    setCurrentSaleItems(prevItems => [...prevItems, saleItem]);
    setCurrentSaleTotal(prevTotal => prevTotal + paymentAmount);
    // Log is now handled in handleEndSale
    setCurrentView('main');
  };

  const handleSetPSK = async (psk) => {
    const newConfig = { ...appConfig, psk: psk, firstRun: false };
    setAppConfig(newConfig);
    await saveAppConfig(newConfig);
    setShowPSKModal(false);
    setShowPSKManageModal(false);
    Alert.alert("PSK Set", "The Pre-Shared Key has been saved.");
  };

  const handlePSKManage = async (mode, oldPsk, newPsk) => {
    if (mode === 'set' || mode === 'change') {
      if (appConfig.psk && oldPsk !== appConfig.psk) {
        Alert.alert("Incorrect PSK", "The old PSK is incorrect.");
        return;
      }
      if (!newPsk || newPsk.length < 4) {
        Alert.alert("Invalid PSK", "New PSK must be at least 4 characters.");
        return;
      }
      const newConfig = { ...appConfig, psk: newPsk };
      setAppConfig(newConfig);
      await saveAppConfig(newConfig);
      Alert.alert("Success", `PSK has been ${mode === 'set' ? 'set' : 'changed'}.`);
    } else if (mode === 'remove') {
      if (appConfig.psk && oldPsk !== appConfig.psk) {
        Alert.alert("Incorrect PSK", "The current PSK is incorrect.");
        return;
      }
      const newConfig = { ...appConfig, psk: null };
      setAppConfig(newConfig);
      await saveAppConfig(newConfig);
      Alert.alert("Success", "PSK has been removed.");
    }
    setShowPSKManageModal(false);
  };

  const handleNoPSK = async () => {
    const newConfig = { ...appConfig, firstRun: false };
    setAppConfig(newConfig);
    await saveAppConfig(newConfig);
    setShowPSKModal(false);
  };

  const handleToggleEditMode = () => {
    if (isEditModeEnabled) {
      setIsEditModeEnabled(false);
    } else {
      if (appConfig.psk) {
        setShowPSKVerifyModal(true);
      } else {
        setIsEditModeEnabled(true);
      }
    }
  };

  const handleVerifyPSK = (pskInput) => {
    if (pskInput === appConfig.psk) {
      setIsEditModeEnabled(true);
      setShowPSKVerifyModal(false);
      Alert.alert("Success", "Edit mode enabled.");
    } else {
      Alert.alert("Incorrect PSK", "The Pre-Shared Key you entered is incorrect.");
    }
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
      <PSKSetupModal
        isVisible={showPSKModal}
        onSetPSK={handleSetPSK}
        onNoPSK={handleNoPSK}
        colors={colors}
      />
      <PSKVerificationModal
        isVisible={showPSKVerifyModal}
        onVerifyPSK={handleVerifyPSK}
        onClose={() => setShowPSKVerifyModal(false)}
        colors={colors}
      />
      <PSKManageModal
        isVisible={showPSKManageModal}
        mode={pskManageMode}
        hasPSK={!!appConfig.psk}
        onSave={handlePSKManage}
        onClose={() => setShowPSKManageModal(false)}
        colors={colors}
      />
      <View style={[styles.header, { backgroundColor: colors.headerBg }]}>
        <TouchableOpacity style={styles.headerIconButton} onPress={handleToggleEditMode}>
          <MaterialIcons name={isEditModeEnabled ? "lock-open" : "lock"} size={24} color={colors.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: colors.headerText }]}>LeGrande Accents</Text>
        <View style={styles.headerRightContainer}>
            <TouchableOpacity style={styles.headerIconButton} onPress={showTimeClockView}>
                <MaterialIcons name="schedule" size={24} color={colors.headerText} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.devButton, { backgroundColor: colors.buttonBgSecondary }]}
              onPress={currentView === 'development' ? showMainView : showDevelopmentView}
            >
              <Text style={[styles.devButtonText, { color: colors.headerText }]}>
                {currentView === 'development' ? 'Main' : 'Dev'}
              </Text>
            </TouchableOpacity>
        </View>
      </View>

      {currentView === 'main' ? (
        <MainScreen
          addToLog={addToLog}
          inventory={inventory}
          updateInventoryState={updateInventoryState}
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
          showDiscountModal={showDiscountModal}
          setShowDiscountModal={setShowDiscountModal}
          discountModalProps={discountModalProps}
          setDiscountModalProps={setDiscountModalProps}
          showLayawayInputModal={showLayawayInputModal}
          setShowLayawayInputModal={setShowLayawayInputModal}
          layawayInputModalProps={layawayInputModalProps}
          setLayawayInputModalProps={setLayawayInputModalProps}
          currentSaleTotal={currentSaleTotal}
          setCurrentSaleTotal={setCurrentSaleTotal}
          currentSaleItems={currentSaleItems}
          setCurrentSaleItems={setCurrentSaleItems}
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
          updateInventoryState={updateInventoryState}
          addToLog={addToLog}
          showMainView={showMainView}
          menuData={menuData}
          colors={colors}
          setInventory={setInventory}
          saveInventory={saveInventory}
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
          showCashierManagementView={showCashierManagementView}
          populateExampleItems={populateExampleItems}
          exportConfig={exportConfig}
          importConfig={importConfig}
          isEditModeEnabled={isEditModeEnabled}
          colors={colors}
          appConfig={appConfig}
          setPskManageMode={setPskManageMode}
          setShowPSKManageModal={setShowPSKManageModal}
          populateExampleTimeData={populateExampleTimeData}
          clearAllPunchData={clearAllPunchData}
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
          updateInventoryState={updateInventoryState}
        />
      ) : currentView === 'layaway_management' ? (
        <LayawayManagementScreen
          layawayItems={layawayItems}
          setLayawayItems={setLayawayItems}
          saveLayaway={saveLayaway}
          addToLog={addToLog}
          showMainView={showMainView}
          colors={colors}
          onAddLayawayPaymentToSale={handleAddLayawayPaymentToSale}
          isEditModeEnabled={isEditModeEnabled}
        />
      ) : currentView === 'time_clock' ? (
        <TimeClockScreen
          punches={timeClockPunches}
          setPunches={setTimeClockPunches}
          savePunches={saveTimeClockPunches}
          cashiers={cashiers}
          appConfig={appConfig}
          showMainView={showMainView}
          showPayrollSummaryView={showPayrollSummaryView}
          showCashierManagementView={showCashierManagementView}
          colors={colors}
          isEditModeEnabled={isEditModeEnabled}
        />
      ) : currentView === 'cashier_management' ? (
        <CashierManagementScreen
          cashiers={cashiers}
          setCashiers={setCashiers}
          saveCashiers={saveCashiers}
          showDevelopmentView={showDevelopmentView}
          colors={colors}
          isEditModeEnabled={isEditModeEnabled}
        />
      ) : currentView === 'time_clock_dev_menu' ? (
        <TimeClockDevMenu
          appConfig={appConfig}
          setAppConfig={setAppConfig}
          saveAppConfig={saveAppConfig}
          showTimeClockView={showTimeClockView}
          colors={colors}
        />
      ) : currentView === 'payroll_summary' ? (
        <PayrollSummaryScreen
          punches={timeClockPunches}
          cashiers={cashiers}
          showTimeClockView={showTimeClockView}
          colors={colors}
          exportPunchesAsCsv={exportPunchesAsCsv}
        />
      ) : null}
    </SafeAreaView>
  );
};

// --- PSK Setup Modal Component ---
const PSKSetupModal = ({ isVisible, onSetPSK, onNoPSK, colors }) => {
  const [pskInput, setPskInput] = useState('');
  const [wantsToSetPSK, setWantsToSetPSK] = useState(null);

  const handleSetPSK = () => {
    if (pskInput.trim().length < 4) {
      Alert.alert("Invalid PSK", "Pre-Shared Key must be at least 4 characters long.");
      return;
    }
    onSetPSK(pskInput.trim());
    setPskInput('');
    setWantsToSetPSK(null);
  };

  const handleSkipPSK = () => {
    onNoPSK();
    setWantsToSetPSK(null);
  };

  const renderInitialQuestion = () => (
    <>
      <Text style={[styles.modalTitle, { color: colors.text }]}>First Time Setup</Text>
      <Text style={[styles.modalSubtitle, { color: colors.text }]}>
        Would you like to set a password (PSK)? This password protects administrative features like editing menus and time punches.
      </Text>
      <Text style={[styles.modalSubtitle, { fontSize: 14, color: colors.logDetails, fontStyle: 'italic' }]}>
        You can set, change, or remove this password later in the Dev menu.
      </Text>
      <View style={styles.modalActionButtons}>
        <TouchableOpacity
          style={[styles.modalActionButton, { backgroundColor: colors.buttonBgDanger }]}
          onPress={() => setWantsToSetPSK(false)}
        >
          <Text style={[styles.buttonText, { color: colors.headerText }]}>No, Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalActionButton, { backgroundColor: colors.buttonBgPrimary }]}
          onPress={() => setWantsToSetPSK(true)}
        >
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Yes, Set PSK</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderSetPSK = () => (
    <>
      <Text style={[styles.modalTitle, { color: colors.text }]}>Set Your PSK</Text>
      <TextInput
        style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
        placeholder="Enter PSK (min 4 characters)"
        placeholderTextColor={colors.logDetails}
        value={pskInput}
        onChangeText={setPskInput}
        secureTextEntry
      />
      <TouchableOpacity
        style={[styles.modalButton, { backgroundColor: colors.buttonBgPrimary, width: '100%' }]}
        onPress={handleSetPSK}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Save PSK and Start</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modalActionButton, { backgroundColor: colors.buttonBgSecondary, marginTop: 10 }]}
        onPress={() => setWantsToSetPSK(null)}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Back</Text>
      </TouchableOpacity>
    </>
  );

  const renderSkipWarning = () => (
    <>
      <Text style={[styles.modalTitle, { color: colors.text }]}>Are you sure?</Text>
      <Text style={[styles.modalSubtitle, { color: colors.text }]}>
        Without a PSK, anyone can access the Dev menu to modify time punches. The lock icon will still prevent accidental edits to inventory and menus.
      </Text>
      <View style={styles.modalActionButtons}>
        <TouchableOpacity
          style={[styles.modalActionButton, { backgroundColor: colors.buttonBgSecondary }]}
          onPress={() => setWantsToSetPSK(null)}
        >
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Go Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modalActionButton, { backgroundColor: colors.buttonBgPrimary }]}
          onPress={handleSkipPSK}
        >
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Continue Without PSK</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={() => {}}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          {wantsToSetPSK === null && renderInitialQuestion()}
          {wantsToSetPSK === true && renderSetPSK()}
          {wantsToSetPSK === false && renderSkipWarning()}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- PSK Verification Modal Component ---
const PSKVerificationModal = ({ isVisible, onVerifyPSK, onClose, colors }) => {
  const [pskInput, setPskInput] = useState('');

  const handleSubmit = () => {
    onVerifyPSK(pskInput);
    setPskInput('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Enter PSK</Text>
          <Text style={[styles.modalSubtitle, { color: colors.text }]}>
            Please enter the Pre-Shared Key to enable edit mode.
          </Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Enter PSK"
            placeholderTextColor={colors.logDetails}
            value={pskInput}
            onChangeText={setPskInput}
            secureTextEntry
          />
          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgDanger }]}
              onPress={() => { setPskInput(''); onClose(); }}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgPrimary }]}
              onPress={handleSubmit}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Unlock</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- PSK Management Modal Component ---
const PSKManageModal = ({ isVisible, mode, hasPSK, onSave, onClose, colors }) => {
  const [oldPsk, setOldPsk] = useState('');
  const [newPsk, setNewPsk] = useState('');
  const [confirmNewPsk, setConfirmNewPsk] = useState('');

  useEffect(() => {
    if (isVisible) {
      setOldPsk('');
      setNewPsk('');
      setConfirmNewPsk('');
    }
  }, [isVisible]);

  const getTitle = () => {
    if (mode === 'set') return 'Set New PSK';
    if (mode === 'change') return 'Change PSK';
    if (mode === 'remove') return 'Remove PSK';
    return 'Manage PSK';
  };

  const handleSave = () => {
    if (mode === 'change' && newPsk !== confirmNewPsk) {
      Alert.alert("Error", "New PSKs do not match.");
      return;
    }
    onSave(mode, oldPsk, newPsk);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{getTitle()}</Text>

          {hasPSK && (mode === 'change' || mode === 'remove') && (
            <TextInput
              style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Enter Current PSK"
              placeholderTextColor={colors.logDetails}
              value={oldPsk}
              onChangeText={setOldPsk}
              secureTextEntry
            />
          )}

          {(mode === 'set' || mode === 'change') && (
            <>
              <TextInput
                style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Enter New PSK (min 4 chars)"
                placeholderTextColor={colors.logDetails}
                value={newPsk}
                onChangeText={setNewPsk}
                secureTextEntry
              />
              {mode === 'change' && (
                <TextInput
                  style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                  placeholder="Confirm New PSK"
                  placeholderTextColor={colors.logDetails}
                  value={confirmNewPsk}
                  onChangeText={setConfirmNewPsk}
                  secureTextEntry
                />
              )}
            </>
          )}

          {mode === 'remove' && (
            <Text style={[styles.modalSubtitle, { color: colors.text }]}>
              Enter your current PSK to confirm removal. This will disable password protection for administrative features.
            </Text>
          )}

          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgDanger }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgPrimary }]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


// --- Discount Modal Component ---
const DiscountModal = ({ isVisible, onClose, onSelectDiscount, onManualDiscount, onGoBack, onCancelSale, itemDetails, colors }) => {
  const [manualPercentage, setManualPercentage] = useState('');

  useEffect(() => {
    if (isVisible) {
      setManualPercentage('');
    }
  }, [isVisible, itemDetails]);

  const handleManualDiscountSubmit = () => {
    const percentage = parseFloat(manualPercentage);
    if (!isNaN(percentage) && percentage >= 0 && percentage <= 100) {
      onManualDiscount(percentage);
      onClose();
    }
    else {
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

// --- Layaway Input Modal Component ---
const LayawayInputModal = ({ isVisible, onClose, onConfirmLayaway, itemDetails, colors }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  useEffect(() => {
    if (isVisible) {
      setCustomerName('');
      setCustomerPhone('');
    }
  }, [isVisible]);

  const handleSubmit = () => {
    if (itemDetails) {
      onConfirmLayaway({ customerName, customerPhone });
    }
  };

  if (!itemDetails) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Layaway for "{itemDetails.item}"</Text>
          <Text style={[styles.modalSubtitle, { color: colors.text }]}>
            Original Price: ${itemDetails.originalPrice.toFixed(2)}
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.text }]}>
            Down Payment (30%): ${(itemDetails.originalPrice * 0.30).toFixed(2)}
          </Text>

          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Customer Name (Optional)"
            placeholderTextColor={colors.logDetails}
            value={customerName}
            onChangeText={setCustomerName}
            autoCapitalize="words"
          />
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Customer Phone (Optional)"
            placeholderTextColor={colors.logDetails}
            keyboardType="phone-pad"
            value={customerPhone}
            onChangeText={setCustomerPhone}
          />

          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: colors.buttonBgPrimary, width: '100%' }]}
            onPress={handleSubmit}
          >
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Confirm Layaway</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modalActionButton, { backgroundColor: colors.buttonBgDanger, marginTop: 10 }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


// --- Main Screen Component ---
const MainScreen = ({
  addToLog, inventory, updateInventoryState, showLogView, showInventoryView, showMenuManagementView, showLayawayManagementView,
  menuData, colors, setInventory, saveInventory, saveMenus, setMenuData, setLastCompletedSaleTotal, layawayItems, setLayawayItems,
  saveLayaway, showDiscountModal, setShowDiscountModal, discountModalProps, setDiscountModalProps, showLayawayInputModal,
  setShowLayawayInputModal, layawayInputModalProps, setLayawayInputModalProps,
  currentSaleTotal, setCurrentSaleTotal, currentSaleItems, setCurrentSaleItems
}) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [customItemInput, setCustomItemInput] = useState('');
  const [customItemPriceInput, setCustomItemPriceInput] = useState(String(DEFAULT_ITEM_PRICE.toFixed(2)));
  const [searchTerm, setSearchTerm] = useState('');
  const [allSearchableItems, setAllSearchableItems] = useState([]);
  const [isClipAdjustmentMode, setIsClipAdjustmentMode] = useState(false);


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
          const tempItemData = {
            itemCode: generateUniqueItemCode(category, brand, item),
            category: category,
            brand: brand,
            item: item,
            quantity: 'N/A',
            price: priceToUse || DEFAULT_ITEM_PRICE,
          };
          handleLogSale(category, brand, item, tempItemData.price, 'No', true, tempItemData);
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
              onPress: async (priceText) => {
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
                  const updatedInventory = updateInventoryState(category, brand, item, newItemData, inventory);
                  setInventory(updatedInventory);
                  await saveInventory(updatedInventory);
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
                "",
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
                    onPress: () => {
                      setLayawayInputModalProps({ category, brand, item, originalPrice: currentItemPrice, itemData: itemData });
                      setShowLayawayInputModal(true);
                    },
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
      "",
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
          onPress: () => {
            setLayawayInputModalProps({ category, brand, item, originalPrice: currentItemPrice, itemData: itemData });
            setShowLayawayInputModal(true);
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleApplyDiscount = (discountPercentage) => {
    const { category, brand, item, currentPrice, noInventoryUpdate, passedItemData } = discountModalProps;
    const discountedPrice = currentPrice * (1 - (discountPercentage / 100));
    const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
    handleLogSale(category, brand, item, discountedPrice, `${discountPercentage}% Discount`, noInventoryUpdate, tempItemData);
    setIsClipAdjustmentMode(false);
  };

  const handleApplyManualDiscount = (percentage) => {
    const { category, brand, item, currentPrice, noInventoryUpdate, passedItemData } = discountModalProps;
    const discountedPrice = currentPrice * (1 - (percentage / 100));
    const tempItemData = passedItemData || { itemCode: generateUniqueItemCode(category, brand, item), category, brand, item, quantity: 'N/A', price: currentPrice };
    handleLogSale(category, brand, item, discountedPrice, `${percentage}% Discount`, noInventoryUpdate, tempItemData);
    setIsClipAdjustmentMode(false);
  };

  const handleDiscountModalBack = () => {
    const { category, brand, item } = discountModalProps;
    handleItemClickForSale(category, brand, item);
    setIsClipAdjustmentMode(false);
  };

  const handleDiscountModalCancelSale = () => {
    setIsClipAdjustmentMode(false);
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
      isLayawayPayment: false,
      isLayawayFinalSale: false,
    };
    setCurrentSaleItems(prevItems => [...prevItems, saleItem]);
    setCurrentSaleTotal(prevTotal => prevTotal + priceSold);

    if (!noInventoryUpdate && saleItem.isInventoryTracked) {
      const newQuantity = parseInt(itemData.quantity, 10) - 1;
      const updatedInventory = updateInventoryState(category, brand, item, {
        ...itemData,
        quantity: newQuantity,
        lastChange: 'Pending Sale (-1)',
        lastChangeDate: new Date().toLocaleString()
      }, inventory);
      setInventory(updatedInventory);
    }

    setSelectedCategory(null);
    setSelectedBrand(null);
    setCustomItemInput('');
    setSearchTerm('');
  };

 const handleLayawayItem = (category, brand, item, originalPrice, customerName = '', customerPhone = '') => {
    const itemData = inventory[category]?.[brand]?.[item];

    if (!itemData) {
      console.error("Error: itemData is undefined in handleLayawayItem for", category, brand, item);
      Alert.alert("Error", "Could not place item on layaway due to missing item data. Please try again.");
      return;
    }

    const downPayment = originalPrice * 0.30;

    const layawayEntry = {
      layawayId: Date.now() + Math.random(),
      itemCode: itemData.itemCode,
      category: category,
      brand: brand,
      item: item,
      originalPrice: originalPrice,
      amountPaid: 0, // Amount paid will be updated when the sale is completed
      remainingBalance: originalPrice,
      layawayDate: new Date().toLocaleString(),
      isInventoryTracked: category !== 'Clips, etc.' && category !== 'Other',
      customerName: customerName,
      customerPhone: customerPhone,
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
      isLayawayPayment: false,
      isLayawayFinalSale: false,
      layawayId: layawayEntry.layawayId,
      // --- Add these three lines to store data for duplication ---
      layawayOriginalPrice: originalPrice,
      layawayCustomerName: customerName,
      layawayCustomerPhone: customerPhone,
    };
    setCurrentSaleItems(prevItems => [...prevItems, saleItem]);
    setCurrentSaleTotal(prevTotal => prevTotal + downPayment);

    Alert.alert(
      "Layaway Initiated",
      `${item} placed on layaway. Down payment of $${downPayment.toFixed(2)} added to current sale.`
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
      "Are you sure you want to remove the last item from the current sale?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Undo",
          onPress: () => {
            const lastItem = currentSaleItems[currentSaleItems.length - 1];
            if (!lastItem) return;

            setCurrentSaleTotal(prevTotal => prevTotal - lastItem.priceSold);

            if (lastItem.isInventoryTracked) {
              const itemData = inventory[lastItem.category]?.[lastItem.brand]?.[lastItem.item];
              if (itemData) {
                const newQuantity = parseInt(itemData.quantity, 10) - lastItem.originalQuantityChange;
                const updatedInventory = updateInventoryState(lastItem.category, lastItem.brand, lastItem.item, {
                  ...itemData,
                  quantity: newQuantity,
                  lastChange: `Pending Sale Undone (+${-lastItem.originalQuantityChange})`,
                  lastChangeDate: new Date().toLocaleString()
                }, inventory);
                setInventory(updatedInventory);
              }
            }

            if (lastItem.isLayawayDownPayment) {
              setLayawayItems(prev => prev.filter(item => item.layawayId !== lastItem.layawayId));
            }

            setCurrentSaleItems(prevItems => prevItems.slice(0, -1));
          }
        }
      ]
    );
  };


const handlePlusOneLastItem = () => {
    if (currentSaleItems.length === 0) {
      Alert.alert("Error", "No items in the current sale to add another.");
      return;
    }

    const lastItem = currentSaleItems[currentSaleItems.length - 1];

    // Handle the special case for duplicating a layaway item
    if (lastItem.isLayawayDownPayment) {
      // Check if we have the necessary data stored from the first change
      if (lastItem.layawayOriginalPrice === undefined) {
        Alert.alert("Error", "Cannot duplicate this layaway item. Please add it again manually.");
        return;
      }
      
      // 1. Create a new, separate layaway entry
      const newLayawayEntry = {
        layawayId: Date.now() + Math.random(),
        itemCode: lastItem.itemCode,
        category: lastItem.category,
        brand: lastItem.brand,
        item: lastItem.item,
        originalPrice: lastItem.layawayOriginalPrice,
        amountPaid: 0,
        remainingBalance: lastItem.layawayOriginalPrice,
        layawayDate: new Date().toLocaleString(),
        isInventoryTracked: lastItem.category !== 'Clips, etc.' && lastItem.category !== 'Other',
        customerName: lastItem.layawayCustomerName,
        customerPhone: lastItem.layawayCustomerPhone,
      };

      // 2. Save the new layaway entry immediately
      setLayawayItems(prevItems => {
          const updatedLayawayItems = [...prevItems, newLayawayEntry];
          saveLayaway(updatedLayawayItems);
          return updatedLayawayItems;
      });

      // 3. Create a new sale item for the down payment, linked to the new layaway
      const newSaleItem = {
          ...lastItem,
          saleItemId: Date.now() + Math.random(),
          layawayId: newLayawayEntry.layawayId, // Link to the NEW layaway
      };
      
      // 4. Add the new down payment to the current sale
      setCurrentSaleItems(prevItems => [...prevItems, newSaleItem]);
      setCurrentSaleTotal(prevTotal => prevTotal + newSaleItem.priceSold);
      
      Alert.alert("Success", `Added another layaway for "${lastItem.item}" to the sale.`);
      return; // Stop here for the layaway case
    }

    // Original logic for all non-layaway items
    const processSale = () => {
      const newSaleItem = {
        ...lastItem,
        saleItemId: Date.now() + Math.random(), // new unique ID
      };

      setCurrentSaleItems(prevItems => [...prevItems, newSaleItem]);
      setCurrentSaleTotal(prevTotal => prevTotal + lastItem.priceSold);

      if (lastItem.isInventoryTracked) {
        const itemData = inventory[lastItem.category]?.[lastItem.brand]?.[lastItem.item];
        if (itemData) {
          const newQuantity = parseInt(itemData.quantity, 10) - 1;
          const updatedInventory = updateInventoryState(lastItem.category, lastItem.brand, lastItem.item, {
            ...itemData,
            quantity: newQuantity,
            lastChange: 'Pending Sale (-1)',
            lastChangeDate: new Date().toLocaleString()
          }, inventory);
          setInventory(updatedInventory);
        }
      }
    };

    if (lastItem.isInventoryTracked) {
      const itemData = inventory[lastItem.category]?.[lastItem.brand]?.[lastItem.item];
      if (itemData && itemData.quantity <= 0) {
        Alert.alert(
          "Warning: Out of Stock",
          `${lastItem.item} is out of stock. Do you still want to sell it?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sell Anyway", onPress: processSale },
          ]
        );
      } else {
        processSale();
      }
    } else {
      processSale();
    }
  };
// ... rest of the MainScreen component
  const handleEndSale = async () => {
    if (currentSaleItems.length === 0) {
        Alert.alert("Empty Sale", "There are no items to complete in the current sale.");
        return;
    }

    Alert.alert(
        "Complete Sale",
        `Final total for this sale: $${currentSaleTotal.toFixed(2)}`,
        [{
            text: "OK",
            onPress: async () => {
                let updatedInventory = { ...inventory };
                let updatedLayaways = [...layawayItems];
                let completedLayawayMessages = [];

                for (const saleItem of currentSaleItems) {
                    if (saleItem.isInventoryTracked) {
                        const itemData = updatedInventory[saleItem.category]?.[saleItem.brand]?.[saleItem.item];
                        if (itemData) {
                            const newQuantity = parseInt(itemData.quantity, 10);
                            const quantityChange = saleItem.originalQuantityChange;
                            updatedInventory = updateInventoryState(saleItem.category, saleItem.brand, saleItem.item, {
                                ...itemData,
                                lastChange: `Sold (${quantityChange})`,
                                lastChangeDate: new Date().toLocaleString()
                            }, updatedInventory);
                            addToLog("Sold Item", saleItem.itemCode, saleItem.category, saleItem.brand, saleItem.item, quantityChange, newQuantity, saleItem.priceSold, saleItem.discountApplied);
                        }
                    } else if (saleItem.isLayawayDownPayment || saleItem.isLayawayPayment) {
                        const layawayIndex = updatedLayaways.findIndex(l => l.layawayId === saleItem.layawayId);
                        if (layawayIndex !== -1) {
                            const layawayItem = { ...updatedLayaways[layawayIndex] };
                            const newAmountPaid = layawayItem.amountPaid + saleItem.priceSold;
                            const newRemainingBalance = layawayItem.originalPrice - newAmountPaid;

                            layawayItem.amountPaid = newAmountPaid;
                            layawayItem.remainingBalance = newRemainingBalance;
                            updatedLayaways[layawayIndex] = layawayItem;

                            addToLog(saleItem.isLayawayDownPayment ? "Layaway Down Payment" : "Layaway Payment", saleItem.itemCode, saleItem.category, saleItem.brand, saleItem.item, 'N/A', 'N/A', saleItem.priceSold, saleItem.discountApplied);

                            if (newRemainingBalance <= 0) {
                                if (layawayItem.isInventoryTracked) {
                                    const itemData = updatedInventory[layawayItem.category]?.[layawayItem.brand]?.[layawayItem.item];
                                    if (itemData) {
                                        const newQuantity = parseInt(itemData.quantity, 10) - 1;
                                        updatedInventory = updateInventoryState(layawayItem.category, layawayItem.brand, layawayItem.item, {
                                            ...itemData,
                                            quantity: newQuantity,
                                            lastChange: 'Layaway Completed (-1)',
                                            lastChangeDate: new Date().toLocaleString()
                                        }, updatedInventory);
                                        addToLog("Layaway Completed", layawayItem.itemCode, layawayItem.category, layawayItem.brand, layawayItem.item, -1, newQuantity, 'N/A', 'Finalized');
                                    }
                                }
                                completedLayawayMessages.push(`${layawayItem.item} has been paid off and finalized.`);
                                updatedLayaways = updatedLayaways.filter(l => l.layawayId !== saleItem.layawayId);
                            }
                        }
                    } else {
                        addToLog("Sold Item (No Inv. Track)", saleItem.itemCode, saleItem.category, saleItem.brand, saleItem.item, 'N/A', 'N/A', saleItem.priceSold, saleItem.discountApplied);
                    }
                }

                setInventory(updatedInventory);
                setLayawayItems(updatedLayaways);
                await saveInventory(updatedInventory);
                await saveLayaway(updatedLayaways);

                if (completedLayawayMessages.length > 0) {
                    Alert.alert("Layaway(s) Completed", completedLayawayMessages.join('\n'));
                }

                setLastCompletedSaleTotal(currentSaleTotal);
                setCurrentSaleTotal(0);
                setCurrentSaleItems([]);
            }
        }]
    );
  };


  const handleCancelSale = async () => {
    if (currentSaleItems.length === 0) {
        return;
    }
    Alert.alert(
      "Cancel Sale",
      "Are you sure you want to cancel the current sale? All items will be removed and inventory changes will be reverted.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          onPress: async () => {
            let inventoryToRevert = { ...inventory };
            let layawaysToRevert = [...layawayItems];

            for (const saleItem of currentSaleItems) {
              if (saleItem.isInventoryTracked) {
                const itemData = inventoryToRevert[saleItem.category]?.[saleItem.brand]?.[saleItem.item];
                if (itemData) {
                  const newQuantity = parseInt(itemData.quantity, 10) - saleItem.originalQuantityChange;
                  inventoryToRevert = updateInventoryState(saleItem.category, saleItem.brand, saleItem.item, {
                    ...itemData,
                    quantity: newQuantity,
                    lastChange: `Sale Cancelled (+${-saleItem.originalQuantityChange})`,
                    lastChangeDate: new Date().toLocaleString()
                  }, inventoryToRevert);
                }
              }
              if (saleItem.isLayawayDownPayment) {
                layawaysToRevert = layawaysToRevert.filter(l => l.layawayId !== saleItem.layawayId);
                addToLog("Layaway Cancelled", saleItem.itemCode, saleItem.category, saleItem.brand, saleItem.item, 'N/A', 'N/A', saleItem.priceSold, 'Cancelled');
              }
            }

            setInventory(inventoryToRevert);
            setLayawayItems(layawaysToRevert);
            await saveInventory(inventoryToRevert);
            await saveLayaway(layawaysToRevert);

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

    const newItemData = {
      itemCode: generateUniqueItemCode('Other', 'Custom', customItemName),
      category: 'Other',
      brand: 'Custom',
      item: customItemName,
      quantity: 'N/A',
      price: price,
    };

    handleLogSale('Other', 'Custom', customItemName, price, 'No', true, newItemData);

    setCustomItemInput('');
    setCustomItemPriceInput(String(DEFAULT_ITEM_PRICE.toFixed(2)));
  };

  const handleViewSaleItems = () => {
    if (currentSaleItems.length === 0) {
      Alert.alert("Current Sale", "No items in current sale.");
      return;
    }
    const itemList = currentSaleItems.map(item => {
      let status = '';
      if (item.isLayawayDownPayment) {
        status = ' (Layaway Down Pmt)';
      } else if (item.isLayawayPayment) {
        status = ' (Layaway Pmt)';
      } else if (!item.isInventoryTracked) {
        status = ' (No Inv. Track)';
      }
      return `${item.item} - $${item.priceSold.toFixed(2)}${status}`;
    }).join('\n');
    Alert.alert("Current Sale Items", itemList);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
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
                      {itemData.category === 'Clips, etc.' ? `${itemData.item}` : itemData.item}
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
            <Text style={[styles.subtitle, { color: colors.text }]}>Can't find it? Add a custom item (logs sale only, no menu/inventory impact):</Text>
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
            <TouchableOpacity
              style={[
                styles.actionButton,
                { backgroundColor: colors.buttonBgPrimary, opacity: customItemInput.trim() ? 1 : 0.5 }
              ]}
              onPress={customItemInput.trim() ? handleCustomItemSubmit : null}
              disabled={!customItemInput.trim()}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Log Sale: {customItemInput || 'Custom Item'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
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
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ flex: 1 }}
            >
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

                <Text style={[styles.subtitle, { color: colors.text }]}>Or Enter a Custom Item Name (logs sale only, no menu/inventory impact):</Text>
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
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.buttonBgPrimary, opacity: customItemInput.trim() ? 1 : 0.5 }
                  ]}
                  onPress={customItemInput.trim() ? handleCustomItemSubmit : null}
                  disabled={!customItemInput.trim()}
                >
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
            </KeyboardAvoidingView>
          ) : null}
        </>
      )}

      <View style={[styles.footer, { borderTopColor: colors.logEntryBorder, backgroundColor: colors.background }]}>
        {currentSaleTotal > 0 ? (
          <View style={styles.saleActionsContainer}>
            <TouchableOpacity style={[styles.endSaleButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleEndSale}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Complete Sale: ${currentSaleTotal.toFixed(2)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary, marginBottom: 10 }]}
              onPress={handleViewSaleItems}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>View Sale Items</Text>
            </TouchableOpacity>
              <View style={styles.editCancelButtons}>
              <TouchableOpacity
                style={[styles.undoLastItemButton, { backgroundColor: colors.buttonBgSecondary, opacity: currentSaleItems.length === 0 ? 0.5 : 1 }]}
                onPress={handleUndoLastSaleItem}
                disabled={currentSaleItems.length === 0}
              >
                <Text style={[styles.buttonText, { color: colors.headerText }]}>Undo Last</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.plusOneButton, { backgroundColor: colors.buttonBgTertiary, opacity: currentSaleItems.length === 0 ? 0.5 : 1 }]}
                onPress={handlePlusOneLastItem}
                disabled={currentSaleItems.length === 0}
              >
                <Text style={[styles.buttonText, { color: colors.headerText }]}>+1 Last</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancelSaleButton, { backgroundColor: colors.buttonBgDanger }]} onPress={handleCancelSale}>
                <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel Sale</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <TouchableOpacity style={[styles.footerButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showLogView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, { backgroundColor: colors.buttonBgTertiary }]} onPress={showInventoryView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Inventory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.footerButton, { backgroundColor: colors.buttonBgTertiary }]} onPress={showLayawayManagementView}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Layaway</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <DiscountModal
        isVisible={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onSelectDiscount={handleApplyDiscount}
        onManualDiscount={handleApplyManualDiscount}
        onGoBack={handleDiscountModalBack}
        onCancelSale={handleCancelSale}
        itemDetails={discountModalProps}
        colors={colors}
      />

      <LayawayInputModal
        isVisible={showLayawayInputModal}
        onClose={() => setShowLayawayInputModal(false)}
        onConfirmLayaway={({ customerName, customerPhone }) => {
          if (layawayInputModalProps) {
            handleLayawayItem(
              layawayInputModalProps.category,
              layawayInputModalProps.brand,
              layawayInputModalProps.item,
              layawayInputModalProps.originalPrice,
              customerName,
              customerPhone
            );
          }
          setShowLayawayInputModal(false);
        }}
        itemDetails={layawayInputModalProps}
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
          [...log].reverse().map((entry, index) => {
            // CORRECTED: Check if the itemCode starts with 'loc-' to identify items from the local category.
            const isLocal = entry.itemCode && entry.itemCode.toLowerCase().startsWith('loc-');
            return (
              <View key={index} style={[styles.logEntry, { borderBottomColor: colors.logEntryBorder }]}>
                <Text style={[styles.logEntryText, { color: colors.logEntryText }]}>
                  <Text style={[styles.logEntryTimestamp, { color: colors.logTimestamp }]}>{entry.timestamp}</Text>
                  <Text style={[styles.logEntryAction, { color: colors.logAction }]}> - {entry.action}</Text>
                </Text>
                <Text style={[styles.logEntryDetails, { color: colors.logDetails }, isLocal && { color: '#27ae60', fontWeight: 'bold' }]}>
                  Item: {entry.category} - {entry.brand} - {entry.item} (Code: {entry.itemCode}) {isLocal ? '(Local)' : ''}
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
            );
          })
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



// --- Time Clock Screen Component ---
const TimeClockScreen = ({ punches, setPunches, savePunches, cashiers, appConfig, showMainView, showPayrollSummaryView, showCashierManagementView, colors, isEditModeEnabled }) => {
  const [activeCashier, setActiveCashier] = useState(null);
  const [showCashierSelection, setShowCashierSelection] = useState(true);
  const [editingPunch, setEditingPunch] = useState(null);
  const [editedPunchDate, setEditedPunchDate] = useState(new Date());
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [showEditReasonModal, setShowEditReasonModal] = useState(false);
  const [editReason, setEditReason] = useState('');

  const getValidEditDateRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let validStart, validEnd;

    if (day < 15) { // Current period is 1st-14th
      validEnd = new Date(year, month, 15); // End of current period
      validStart = new Date(year, month - 1, 15); // Start of previous period
    } else { // Current period is 15th-end
      validEnd = new Date(year, month + 1, 1); // End of current period
      validStart = new Date(year, month, 1); // Start of previous period
    }
    return { start: validStart, end: validEnd };
  };

  const handleSelectCashier = (cashier) => {
    setActiveCashier(cashier);
    setShowCashierSelection(false);

    const cashierPunches = punches
      .filter(p => p.cashierCode === cashier.code)
      .sort((a, b) => new Date(b.time) - new Date(a.time));

    if (cashierPunches.length > 0 && cashierPunches[0].type === 'IN') {
      setIsClockedIn(true);
    } else {
      setIsClockedIn(false);
    }
  };

  const handlePunch = (type) => {
    if (!activeCashier) {
      Alert.alert("Error", "No cashier selected.");
      return;
    }

    const newPunch = {
      id: `${new Date().toISOString()}-${Math.random()}`,
      cashierCode: activeCashier.code,
      time: new Date().toISOString(),
      type,
      originalTime: new Date().toISOString(),
      editedBy: null,
      editReason: null,
    };

    const newPunches = [...punches, newPunch];
    setPunches(newPunches);
    savePunches(newPunches);
    setIsClockedIn(type === 'IN');
    Alert.alert("Success", `${activeCashier.name} punched ${type.toLowerCase()} at ${new Date().toLocaleTimeString()}`);
  };

  const handleEditPunch = (punch) => {
    setEditingPunch(punch);
    setEditedPunchDate(new Date(punch.time));
  };

  const handleDeletePunch = (punchId) => {
    Alert.alert(
      "Delete Punch",
      "Are you sure you want to permanently delete this time punch? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedPunches = punches.filter(p => p.id !== punchId);
            setPunches(updatedPunches);
            savePunches(updatedPunches);
          },
        },
      ]
    );
  };

  const handleSaveEdit = () => {
    if (!editingPunch || !editedPunchDate) return;

    const { start, end } = getValidEditDateRange();
    if (editedPunchDate < start || editedPunchDate > end) {
      Alert.alert(
        "Invalid Date",
        `The edited time must be within the current or previous pay period.\n\nValid range: ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`
      );
      return;
    }
    setShowEditReasonModal(true);
  };

  const handleConfirmSaveEdit = () => {
    if (!editReason.trim()) {
      Alert.alert("Reason Required", "Please provide a reason for the edit.");
      return;
    }

    const updatedTime = editedPunchDate.toISOString();
    const updatedPunches = punches.map(p => {
      if (p.id === editingPunch.id) {
        return {
          ...p,
          time: updatedTime,
          originalTime: p.originalTime || p.time,
          editedBy: activeCashier.code,
          editReason: editReason,
        };
      }
      return p;
    });
    setPunches(updatedPunches);
    savePunches(updatedPunches);

    setEditingPunch(null);
    setShowEditReasonModal(false);
    setEditReason('');
  };

  const activeCashierPunches = useMemo(() => {
    if (!activeCashier) return [];
    return [...punches]
      .filter(p => p.cashierCode === activeCashier.code)
      .sort((a, b) => new Date(b.time) - new Date(a.time));
  }, [punches, activeCashier]);

  if (showCashierSelection) {
    return (
      <Modal visible={true} transparent={true} animationType="fade">
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Select Cashier</Text>
            {cashiers.length === 0 ? (
              <View style={{alignItems: 'center', width: '100%'}}>
                <Text style={[styles.modalSubtitle, { color: colors.text }]}>
                  No cashiers found. Please add a cashier to use the Time Clock.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ width: '100%' }}>
                {cashiers.map(cashier => (
                  <TouchableOpacity
                    key={cashier.code}
                    style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]}
                    onPress={() => handleSelectCashier(cashier)}
                  >
                    <Text style={[styles.buttonText, { color: colors.headerText }]}>{cashier.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            <View style={styles.cashierSelectNavButtons}>
                <TouchableOpacity
                    style={[styles.footerButton, { backgroundColor: colors.buttonBgTertiary }]}
                    onPress={showCashierManagementView}
                >
                    <Text style={[styles.buttonText, { color: colors.headerText }]}>Edit Cashiers</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.footerButton, { backgroundColor: colors.buttonBgTertiary }]}
                    onPress={showPayrollSummaryView}
                >
                    <Text style={[styles.buttonText, { color: colors.headerText }]}>Payroll</Text>
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary, width: '100%' }]} onPress={showMainView}>
              <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Main App'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Time Clock</Text>
      <Text style={[styles.subtitle, { color: colors.text, textAlign: 'center' }]}>
        Welcome, {activeCashier?.name}
      </Text>

      <View style={styles.timeClockButtonRow}>
        <TouchableOpacity
          style={[styles.timeClockButton, { backgroundColor: colors.buttonBgPrimary, opacity: isClockedIn ? 0.5 : 1 }]}
          onPress={() => handlePunch('IN')}
          disabled={isClockedIn}
        >
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Punch IN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.timeClockButton, { backgroundColor: colors.buttonBgDanger, opacity: !isClockedIn ? 0.5 : 1 }]}
          onPress={() => handlePunch('OUT')}
          disabled={!isClockedIn}
        >
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Punch OUT</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.subtitle, { color: colors.text, textAlign: 'center' }]}>Your Punch History</Text>
      <FlatList
        style={[styles.logContainer, { backgroundColor: colors.cardBg }]}
        data={activeCashierPunches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.timeClockPunchItem, { borderBottomColor: colors.logEntryBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: 'bold' }}>{item.type} at {new Date(item.time).toLocaleTimeString()}</Text>
              <Text style={{ color: colors.logDetails }}>{new Date(item.time).toLocaleDateString()}</Text>
              {item.editReason && (
                <Text style={{ color: colors.warningText, fontSize: 12, fontStyle: 'italic' }}>
                  Edited: {item.editReason}
                </Text>
              )}
            </View>
            {isEditModeEnabled && (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={[styles.smallActionButton, { backgroundColor: colors.buttonBgSecondary, marginRight: 10 }]}
                  onPress={() => handleEditPunch(item)}
                >
                  <Text style={[styles.smallButtonText, { color: colors.headerText }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallActionButton, { backgroundColor: colors.buttonBgDanger }]}
                  onPress={() => handleDeletePunch(item.id)}
                >
                  <Text style={[styles.smallButtonText, { color: colors.headerText }]}>Del</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      />

      <Modal
        visible={!!editingPunch}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingPunch(null)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: colors.cardBg, maxHeight: '90%' }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Punch Time</Text>
            <PunchDateTimePicker
              initialDate={editedPunchDate}
              onDateChange={setEditedPunchDate}
              colors={colors}
            />
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary, width: '100%' }]} onPress={handleSaveEdit}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Continue to Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgDanger, width: '100%' }]} onPress={() => setEditingPunch(null)}>
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
          visible={showEditReasonModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowEditReasonModal(false)}
      >
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
              <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Reason for Edit</Text>
                  <TextInput
                      style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                      placeholder="e.g., Forgot to punch out"
                      placeholderTextColor={colors.logDetails}
                      value={editReason}
                      onChangeText={setEditReason}
                  />
                  <View style={styles.modalActionButtons}>
                      <TouchableOpacity
                          style={[styles.modalActionButton, { backgroundColor: colors.buttonBgDanger }]}
                          onPress={() => {
                              setShowEditReasonModal(false);
                              setEditReason('');
                          }}
                      >
                          <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                          style={[styles.modalActionButton, { backgroundColor: colors.buttonBgPrimary }]}
                          onPress={handleConfirmSaveEdit}
                      >
                          <Text style={[styles.buttonText, { color: colors.headerText }]}>Confirm Edit</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </KeyboardAvoidingView>
      </Modal>

      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={() => setShowCashierSelection(true)}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Change Cashier'}</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} />
    </View>
  );
};

// --- Punch Date Time Picker Component ---
const PunchDateTimePicker = ({ initialDate, onDateChange, colors }) => {
    const date = initialDate || new Date();

    const updateDatePart = (part, value) => {
        const newDate = new Date(date.getTime());
        if (part === 'month') newDate.setMonth(value);
        if (part === 'day') newDate.setDate(value);
        if (part === 'year') newDate.setFullYear(value);
        if (part === 'hour') newDate.setHours(value);
        if (part === 'minute') newDate.setMinutes(value);
        onDateChange(newDate);
    };

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const years = Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i);
    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

    const currentHour12 = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
    const isAM = date.getHours() < 12;

    const PickerColumn = ({ label, items, selectedValue, onValueChange }) => (
        <View style={styles.pickerColumn}>
            <Text style={[styles.pickerLabel, { color: colors.text }]}>{label}</Text>
            <View style={[styles.picker, { borderColor: colors.inputBorder }]}>
                <ScrollView>
                    {items.map(item => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.pickerItem,
                                item === selectedValue && { backgroundColor: colors.pickerSelectedBg }
                            ]}
                            onPress={() => onValueChange(item)}
                        >
                            <Text style={[
                                { color: colors.pickerText },
                                item === selectedValue && { color: colors.pickerSelectedText, fontWeight: 'bold' }
                            ]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
        </View>
    );

    return (
        <View style={styles.dateTimePickerContainer}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%' }}>
                <PickerColumn label="Month" items={months} selectedValue={months[date.getMonth()]} onValueChange={val => updateDatePart('month', months.indexOf(val))} />
                <PickerColumn label="Day" items={days} selectedValue={date.getDate()} onValueChange={val => updateDatePart('day', val)} />
                <PickerColumn label="Year" items={years} selectedValue={date.getFullYear()} onValueChange={val => updateDatePart('year', val)} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 10 }}>
                <PickerColumn label="Hour" items={hours} selectedValue={currentHour12} onValueChange={val => updateDatePart('hour', isAM ? (val % 12) : (val % 12) + 12)} />
                <PickerColumn label="Min" items={minutes} selectedValue={date.getMinutes().toString().padStart(2, '0')} onValueChange={val => updateDatePart('minute', parseInt(val, 10))} />
                <View style={styles.pickerColumn}>
                    <Text style={[styles.pickerLabel, { color: colors.text }]}>AM/PM</Text>
                    <View style={{ flexDirection: 'column' }}>
                        <TouchableOpacity
                            style={[styles.ampmButton, { backgroundColor: isAM ? colors.pickerSelectedBg : colors.pickerBg }]}
                            onPress={() => updateDatePart('hour', date.getHours() - 12)}
                        >
                            <Text style={{ color: isAM ? colors.pickerSelectedText : colors.pickerText }}>AM</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.ampmButton, { backgroundColor: !isAM ? colors.pickerSelectedBg : colors.pickerBg }]}
                            onPress={() => updateDatePart('hour', date.getHours() + 12)}
                        >
                            <Text style={{ color: !isAM ? colors.pickerSelectedText : colors.pickerText }}>PM</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};


// --- Simple Bar Chart Component ---
const SimpleBarChart = ({ data, maxValue, colors, chartTitle }) => {
  const maxBarHeight = 150;

  return (
    <View style={{alignItems: 'center'}}>
      <Text style={[styles.modalTitle, { color: colors.text, fontSize: 18 }]}>{chartTitle}</Text>
      <View style={styles.chartContainer}>
        {data.length === 0 ? (
          <Text style={[styles.chartNoDataText, { color: colors.text }]}>No data to display.</Text>
        ) : (
          data.map((point, index) => (
            <View key={index} style={styles.barWrapper}>
              <Text style={[styles.barValue, { color: colors.text }]}>{point.value}</Text>
              <View
                style={[
                  styles.bar,
                  {
                    height: (point.value / maxValue) * maxBarHeight,
                    backgroundColor: colors.buttonBgPrimary,
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: colors.text }]}>{point.label}</Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

// --- Simple Bar Chart Modal Component ---
const SimpleBarChartModal = ({ isVisible, onClose, data, maxValue, colors, title }) => {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          <ScrollView horizontal contentContainerStyle={styles.chartScrollViewContent}>
            <SimpleBarChart data={data} maxValue={maxValue} colors={colors} chartTitle={title} />
          </ScrollView>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary, marginTop: 20 }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Close Chart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


// --- Inventory Management Screen Component ---
const InventoryManagementScreen = ({ inventory, updateInventoryState, addToLog, showMainView, menuData, colors, setInventory, saveInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryGraphData, setInventoryGraphData] = useState([]);
  const [maxInventoryValue, setMaxInventoryValue] = useState(1);
  const [showInventoryGraphModal, setShowInventoryGraphModal] = useState(false);

  useEffect(() => {
    const aggregateData = () => {
      const categoryQuantities = {};
      let currentMax = 0;

      menuData.categories.forEach(categoryObj => {
        if (categoryObj.name !== 'Clips, etc.' && categoryObj.name !== 'Other') {
          let totalQuantity = 0;
          if (inventory[categoryObj.name]) {
            for (const brandName in inventory[categoryObj.name]) {
              for (const itemName in inventory[categoryObj.name][brandName]) {
                const itemData = inventory[categoryObj.name][brandName][itemName];
                if (typeof itemData.quantity === 'number' && !isNaN(itemData.quantity)) {
                  totalQuantity += itemData.quantity;
                }
              }
            }
          }
          categoryQuantities[categoryObj.name] = totalQuantity;
          if (totalQuantity > currentMax) {
            currentMax = totalQuantity;
          }
        }
      });

      const dataForChart = Object.keys(categoryQuantities)
        .map(categoryName => ({
          label: categoryName,
          value: categoryQuantities[categoryName]
        }))
        .sort((a, b) => b.value - a.value);

      setInventoryGraphData(dataForChart);
      setMaxInventoryValue(currentMax > 0 ? currentMax : 1);
    };

    aggregateData();
  }, [inventory, menuData]);


  const handleAdjustQuantity = async (category, brand, item, adjustment) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const currentQuantity = parseInt(itemData.quantity, 10);
    const newQuantity = currentQuantity + adjustment;
    const quantityChange = adjustment;
    const lastChange = `${quantityChange > 0 ? '+' : ''}${quantityChange}`;
    const lastChangeDate = new Date().toLocaleString();

    const updatedInventory = updateInventoryState(category, brand, item, {
      ...itemData,
      quantity: newQuantity,
      lastChange: lastChange,
      lastChangeDate: lastChangeDate
    }, inventory);
    setInventory(updatedInventory);
    await saveInventory(updatedInventory);
    addToLog("Adjusted Inventory", itemData.itemCode, category, brand, item, quantityChange, newQuantity, itemData.price, 'No');
  };

  const handleManualQuantityChange = async (category, brand, item, text) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const quantity = parseInt(text, 10);
    if (!isNaN(quantity)) {
      const currentQuantity = parseInt(itemData.quantity, 10);
      const quantityChange = quantity - currentQuantity;
      const lastChange = quantityChange !== 0 ? `${quantityChange > 0 ? '+' : ''}${quantityChange}` : 'N/A';
      const lastChangeDate = new Date().toLocaleString();

      const updatedInventory = updateInventoryState(category, brand, item, {
        ...itemData,
        quantity: quantity,
        lastChange: lastChange,
        lastChangeDate: lastChangeDate
      }, inventory);
      setInventory(updatedInventory);
      await saveInventory(updatedInventory);
      addToLog("Manually Set Inventory", itemData.itemCode, category, brand, item, lastChange, quantity, itemData.price, 'No');
    } else if (text === '') {
      // Allow empty input
    } else {
      Alert.alert("Invalid Input", "Please enter a valid number.");
    }
  };

  const handleManualPriceChange = async (category, brand, item, text) => {
    const itemData = inventory[category]?.[brand]?.[item];
    if (!itemData) return;

    const price = parseFloat(text);
    if (!isNaN(price) && price >= 0) {
      const oldPrice = itemData.price;
      const lastChange = `Price changed from $${oldPrice.toFixed(2)} to $${price.toFixed(2)}`;
      const lastChangeDate = new Date().toLocaleString();

      const updatedInventory = updateInventoryState(category, brand, item, {
        ...itemData,
        price: price,
        lastChange: lastChange,
        lastChangeDate: lastChangeDate
      }, inventory);
      setInventory(updatedInventory);
      await saveInventory(updatedInventory);
      addToLog("Price Updated", itemData.itemCode, category, brand, item, 'N/A', itemData.quantity, price, 'No');
    } else if (text === '') {
      // Allow empty input
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={[styles.inventoryListContainer, { backgroundColor: colors.cardBg }]} removeClippedSubviews={true}>
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
                          <Text style={[styles.buttonText, { color: colors.headerText }]}>-</Text>
                        </TouchableOpacity>
                        <TextInput
                          style={[styles.inventoryInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                          keyboardType="numeric"
                          value={String(item.quantity)}
                          onChangeText={(text) => handleManualQuantityChange(item.category, item.brand, item.item, text)}
                        />
                        <TouchableOpacity style={[styles.inventoryButtonSmall, { backgroundColor: colors.buttonBgLight }]} onPress={() => handleAdjustQuantity(item.category, item.brand, item.item, 1)}>
                          <Text style={[styles.buttonText, { color: colors.headerText }]}>+</Text>
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
      </KeyboardAvoidingView>
      <View style={styles.inventoryManagementButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.inventoryManagementButton, styles.graphButton, { backgroundColor: colors.buttonBgTertiary }]}
          onPress={() => setShowInventoryGraphModal(true)}
        >
          <Text style={[styles.buttonText, { color: colors.headerText }]}>View Graph</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.inventoryManagementButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={showMainView}>
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Back to Main App</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomBuffer} />

      <SimpleBarChartModal
        isVisible={showInventoryGraphModal}
        onClose={() => setShowInventoryGraphModal(false)}
        data={inventoryGraphData}
        maxValue={maxInventoryValue}
        colors={colors}
        title="Inventory by Category"
      />
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
const MenuManagementScreen = ({ menuData, setMenuData, saveMenus, inventory, setInventory, saveInventory, addToLog, showMainView, isEditModeEnabled, colors, updateInventoryState }) => {
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

  const handleAddCategory = async () => {
    if (newCategoryInput.trim() !== '' && !menuData.categories.some(cat => cat.name === newCategoryInput.trim())) {
      const updatedCategories = [...menuData.categories, { name: newCategoryInput.trim(), brands: [] }];
      const updatedMenuData = { ...menuData, categories: updatedCategories };
      setMenuData(updatedMenuData);
      await saveMenus(updatedMenuData);
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
          onPress: async () => {
            const updatedMenuData = {
              ...menuData,
              categories: menuData.categories.filter(cat => cat.name !== categoryName)
            };
            setMenuData(updatedMenuData);
            await saveMenus(updatedMenuData);

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

  const handleAddBrand = async () => {
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
          await saveMenus(updatedMenuData);
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
          onPress: async () => {
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
                await saveMenus(updatedMenuData);

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

  const handleAddItem = async () => {
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
          await saveMenus(updatedMenuData);

          if (selectedCategoryForBrand !== 'Clips, etc.' && selectedCategoryForBrand !== 'Other') {
            const updatedInventory = updateInventoryState(selectedCategoryForBrand, selectedBrandForItems, newItemInput.trim(), {
              itemCode: generateUniqueItemCode(selectedCategoryForBrand, selectedBrandForItems, newItemInput.trim()),
              category: selectedCategoryForBrand,
              brand: selectedBrandForItems,
              item: newItemInput.trim(),
              quantity: DEFAULT_ITEM_QUANTITY,
              price: itemPrice,
              lastChange: 'Initial (Menu Add)',
              lastChangeDate: new Date().toLocaleString()
            }, inventory);
            setInventory(updatedInventory);
            await saveInventory(updatedInventory);
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
        { text: "Cancel", "style": "cancel" },
        {
          text: "Delete",
          onPress: async () => {
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
                await saveMenus(updatedMenuData);

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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
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
    </KeyboardAvoidingView>
  );
};

// --- Development Screen Component ---
const DevelopmentScreen = ({
  resetAppData, showMainView, cashierNumber, setCashierNumber, colorScheme, setColorScheme,
  saveColorScheme, showMenuManagementView, showCashierManagementView, populateExampleItems,
  exportConfig, importConfig, isEditModeEnabled, colors, appConfig, setPskManageMode,
  setShowPSKManageModal, populateExampleTimeData, clearAllPunchData
}) => {
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
          style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }, colorScheme === 'light' && { backgroundColor: colors.pickerSelectedBg }]}
          onPress={() => handleSetColorScheme('light')}>
          <Text style={[styles.buttonText, { color: colors.text }, colorScheme === 'light' && { color: colors.pickerSelectedText }]}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }, colorScheme === 'dark' && { backgroundColor: colors.pickerSelectedBg }]}
          onPress={() => handleSetColorScheme('dark')}>
          <Text style={[styles.buttonText, { color: colors.text }, colorScheme === 'dark' && { color: colors.pickerSelectedText }]}>Dark</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }, colorScheme === 'pastel' && { backgroundColor: colors.pickerSelectedBg }]}
          onPress={() => handleSetColorScheme('pastel')}>
          <Text style={[styles.buttonText, { color: colors.text }, colorScheme === 'pastel' && { color: colors.pickerSelectedText }]}>Pastel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.cardBg, shadowColor: colors.shadowColor }, colorScheme === 'christmas' && { backgroundColor: colors.pickerSelectedBg }]}
          onPress={() => handleSetColorScheme('christmas')}>
          <Text style={[styles.buttonText, { color: colors.text }, colorScheme === 'christmas' && { color: colors.pickerSelectedText }]}>Christmas</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary, marginTop: 20 }]} onPress={showMenuManagementView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Go to Menu Management</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary, marginTop: 10 }]} onPress={showCashierManagementView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Go to Cashier Management</Text>
      </TouchableOpacity>

      <Text style={[styles.subtitle, { color: colors.text }]}>PSK Management</Text>
      {appConfig.psk ? (
        <>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={() => { setPskManageMode('change'); setShowPSKManageModal(true); }}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Change PSK</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgDanger }]} onPress={() => { setPskManageMode('remove'); setShowPSKManageModal(true); }}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Remove PSK</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={() => { setPskManageMode('set'); setShowPSKManageModal(true); }}>
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Set PSK</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.subtitle, { color: colors.text }]}>Data & Configuration</Text>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary }]} onPress={exportConfig}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Export Config JSON</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary, opacity: isEditModeEnabled ? 1 : 0.5 }]}
        onPress={isEditModeEnabled ? importConfig : null}
        disabled={!isEditModeEnabled}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Import Config JSON</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary, opacity: isEditModeEnabled ? 1 : 0.5 }]}
        onPress={isEditModeEnabled ? populateExampleItems : null}
        disabled={!isEditModeEnabled}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Populate Example Items</Text>
      </TouchableOpacity>

      <Text style={[styles.subtitle, { color: colors.text }]}>Time Clock Data</Text>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary, opacity: isEditModeEnabled ? 1 : 0.5 }]}
        onPress={isEditModeEnabled ? populateExampleTimeData : null}
        disabled={!isEditModeEnabled}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Populate Example Cashiers/Punches</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgDanger, opacity: isEditModeEnabled ? 1 : 0.5 }]}
        onPress={isEditModeEnabled ? clearAllPunchData : null}
        disabled={!isEditModeEnabled}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Clear All Punch Data</Text>
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
const LayawayManagementScreen = ({ layawayItems, setLayawayItems, saveLayaway, addToLog, showMainView, colors, onAddLayawayPaymentToSale, isEditModeEnabled }) => {
  const [paymentInputs, setPaymentInputs] = useState({});
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingLayawayItem, setEditingLayawayItem] = useState(null);

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

    onAddLayawayPaymentToSale(layawayItem, paymentAmount);
    setPaymentInputs(prev => ({ ...prev, [layawayItem.layawayId]: '' }));
  };

  const handleCancelLayaway = (layawayItem) => {
    Alert.alert(
      "Cancel Layaway",
      `Are you sure you want to cancel layaway for "${layawayItem.item}"? The item will be removed from the layaway list. Inventory will not be affected.`,
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          onPress: async () => {
            const updatedLayawayItems = layawayItems.filter(item => item.layawayId !== layawayItem.layawayId);
            setLayawayItems(updatedLayawayItems);
            await saveLayaway(updatedLayawayItems);
            addToLog("Layaway Cancelled", layawayItem.itemCode, layawayItem.category, layawayItem.brand, layawayItem.item, 'N/A', 'N/A', 'N/A', 'Layaway Cancelled');
            Alert.alert("Layaway Cancelled", `${layawayItem.item} has been removed from layaway.`);
          }
        }
      ]
    );
  };

  const handleOpenEditModal = (item) => {
    setEditingLayawayItem(item);
    setIsEditModalVisible(true);
  };

  const handleUpdateBalance = async (itemToUpdate, newBalanceStr) => {
    const newBalance = parseFloat(newBalanceStr);
    if (isNaN(newBalance) || newBalance < 0) {
      Alert.alert("Invalid Balance", "Please enter a valid positive number for the new balance.");
      return;
    }
    if (newBalance > itemToUpdate.originalPrice) {
      Alert.alert("Invalid Balance", `New balance cannot be greater than the original price of $${itemToUpdate.originalPrice.toFixed(2)}.`);
      return;
    }

    const updatedLayawayItems = layawayItems.map(item => {
      if (item.layawayId === itemToUpdate.layawayId) {
        const newAmountPaid = item.originalPrice - newBalance;
        return {
          ...item,
          remainingBalance: newBalance,
          amountPaid: newAmountPaid,
        };
      }
      return item;
    });

    setLayawayItems(updatedLayawayItems);
    await saveLayaway(updatedLayawayItems);
    addToLog("Layaway Balance Adjusted", itemToUpdate.itemCode, itemToUpdate.category, itemToUpdate.brand, itemToUpdate.item, 'N/A', 'N/A', newBalance.toFixed(2), 'Manual Edit');
    Alert.alert("Success", `Balance for "${itemToUpdate.item}" updated.`);
    setIsEditModalVisible(false);
    setEditingLayawayItem(null);
  };

  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Layaway Management</Text>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
                {item.customerName ? <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Customer: {item.customerName}</Text> : null}
                {item.customerPhone ? <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Phone: {item.customerPhone}</Text> : null}
                <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Original Price: ${item.originalPrice.toFixed(2)}</Text>
                <Text style={[styles.layawayDetailsText, { color: colors.logDetails }]}>Amount Paid: ${item.amountPaid.toFixed(2)}</Text>
                <Text style={[styles.layawayDetailsText, { color: colors.logDetails, fontWeight: 'bold' }]}>Remaining Balance: ${item.remainingBalance.toFixed(2)}</Text>
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
                    style={[styles.layawayActionButton, { backgroundColor: colors.buttonBgDanger }]}
                    onPress={() => handleCancelLayaway(item)}
                  >
                    <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel Layaway</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.layawayActionButton, { backgroundColor: colors.buttonBgSecondary }]}
                    onPress={() => handleOpenEditModal(item)}
                  >
                    <Text style={[styles.buttonText, { color: colors.headerText }]}>Edit Balance</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showMainView}>
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Back to Main App</Text>
      </TouchableOpacity>
      <View style={styles.bottomBuffer} />

      {editingLayawayItem && (
        <EditLayawayBalanceModal
          isVisible={isEditModalVisible}
          onClose={() => setIsEditModalVisible(false)}
          onSave={handleUpdateBalance}
          item={editingLayawayItem}
          colors={colors}
        />
      )}
    </View>
  );
};

// --- Cashier Management Screen Component ---
const CashierManagementScreen = ({ cashiers, setCashiers, saveCashiers, showDevelopmentView, colors, isEditModeEnabled }) => {
  const [isWizardVisible, setWizardVisible] = useState(false);
  const [editingCashier, setEditingCashier] = useState(null);

  const handleAddOrUpdateCashier = (cashierData) => {
    let updatedCashiers;
    if (editingCashier) {
      // Update existing cashier
      updatedCashiers = cashiers.map(c => c.code === editingCashier.code ? { ...c, ...cashierData } : c);
    } else {
      // Add new cashier
      const newCode = String(Math.floor(1000 + Math.random() * 9000));
      if (cashiers.some(c => c.code === newCode)) {
        // Handle rare case of duplicate random code
        handleAddOrUpdateCashier(cashierData);
        return;
      }
      updatedCashiers = [...cashiers, { ...cashierData, code: newCode }];
    }
    setCashiers(updatedCashiers);
    saveCashiers(updatedCashiers);
    setWizardVisible(false);
    setEditingCashier(null);
  };

  const handleRemoveCashier = (cashierCode) => {
    Alert.alert(
      "Remove Cashier",
      "Are you sure you want to remove this cashier? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: () => {
            const updatedCashiers = cashiers.filter(c => c.code !== cashierCode);
            setCashiers(updatedCashiers);
            saveCashiers(updatedCashiers);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Cashier Management</Text>
      {isEditModeEnabled && (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={() => { setEditingCashier(null); setWizardVisible(true); }}>
          <Text style={[styles.buttonText, { color: colors.headerText }]}>Add New Cashier</Text>
        </TouchableOpacity>
      )}

      <FlatList
        style={[styles.logContainer, { backgroundColor: colors.cardBg }]}
        data={cashiers}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <View style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.listItemText, { color: colors.text }]}>{item.name}</Text>
              <Text style={{ color: colors.logDetails }}>Code: {item.code}</Text>
            </View>
            {isEditModeEnabled && (
              <>
                <TouchableOpacity style={[styles.smallActionButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={() => { setEditingCashier(item); setWizardVisible(true); }}>
                  <Text style={[styles.smallButtonText, { color: colors.headerText }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.smallActionButton, { backgroundColor: colors.buttonBgDanger, marginLeft: 10 }]} onPress={() => handleRemoveCashier(item.code)}>
                  <Text style={[styles.smallButtonText, { color: colors.headerText }]}>Remove</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      />

      <CashierWizardModal
        isVisible={isWizardVisible}
        onClose={() => { setWizardVisible(false); setEditingCashier(null); }}
        onSave={handleAddOrUpdateCashier}
        existingCashier={editingCashier}
        colors={colors}
      />

      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showDevelopmentView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Dev Menu'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Cashier Wizard Modal Component ---
const CashierWizardModal = ({ isVisible, onClose, onSave, existingCashier, colors }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (existingCashier) {
      setName(existingCashier.name);
    } else {
      setName('');
    }
  }, [existingCashier, isVisible]);

  const handleSave = () => {
    if (name.trim()) {
      onSave({ name: name.trim() });
    } else {
      Alert.alert("Invalid Name", "Cashier name cannot be empty.");
    }
  };

  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{existingCashier ? 'Edit Cashier' : 'New Cashier Wizard'}</Text>
          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="Cashier Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]} onPress={handleSave}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgDanger }]} onPress={onClose}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- Time Clock Dev Menu Component ---
const TimeClockDevMenu = ({ appConfig, setAppConfig, saveAppConfig, showTimeClockView, colors }) => {
  const togglePunchEditing = (value) => {
    const newConfig = { ...appConfig, allowPunchEditing: value };
    setAppConfig(newConfig);
    saveAppConfig(newConfig);
  };

  return (
    <View style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Time Clock Dev Menu</Text>
      <View style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
        <Text style={[styles.listItemText, { color: colors.text }]}>Allow Punch Editing</Text>
        <Switch
          value={appConfig.allowPunchEditing}
          onValueChange={togglePunchEditing}
        />
      </View>
      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showTimeClockView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Time Clock'}</Text>
      </TouchableOpacity>
    </View>
  );
};

// --- Payroll Summary Screen Component ---
const PayrollSummaryScreen = ({ punches, cashiers, showTimeClockView, colors, exportPunchesAsCsv }) => {
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [graphTitle, setGraphTitle] = useState('');
  const [maxHours, setMaxHours] = useState(1);
  const [showShiftDetailModal, setShowShiftDetailModal] = useState(false);
  const [selectedCashierShifts, setSelectedCashierShifts] = useState({ cashierName: '', shifts: [] });
  const [showAllPunchesModal, setShowAllPunchesModal] = useState(false);
  const [allPunchesForPeriod, setAllPunchesForPeriod] = useState([]);


  const payrollData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();

    let period1, period2;

    if (day < 15) { // Current period is 1st-14th
      period1 = {
        title: `1st - 14th of ${now.toLocaleString('default', { month: 'long' })}`,
        start: new Date(year, month, 1),
        end: new Date(year, month, 15) // Exclusive end
      };
      const prevMonthEnd = new Date(year, month, 0); // Last day of previous month
      const prevMonthStart = new Date(year, month - 1, 15);
      period2 = {
        title: `15th - End of ${prevMonthStart.toLocaleString('default', { month: 'long' })}`,
        start: prevMonthStart,
        end: new Date(year, month, 1)
      };
    } else { // Current period is 15th-end
      period1 = {
        title: `15th - End of ${now.toLocaleString('default', { month: 'long' })}`,
        start: new Date(year, month, 15),
        end: new Date(year, month + 1, 1)
      };
      period2 = {
        title: `1st - 14th of ${now.toLocaleString('default', { month: 'long' })}`,
        start: new Date(year, month, 1),
        end: new Date(year, month, 15)
      };
    }

    const calculateHours = (period) => {
      const totals = {};
      cashiers.forEach(c => { totals[c.code] = { name: c.name, hours: 0, code: c.code }; });

      const relevantPunches = punches.filter(p => {
        const punchTime = new Date(p.time);
        return punchTime >= period.start && punchTime < period.end;
      });

      Object.keys(totals).forEach(cashierCode => {
        const cashierPunches = relevantPunches
          .filter(p => p.cashierCode === cashierCode)
          .sort((a, b) => new Date(a.time) - new Date(b.time));

        let lastPunchInTime = null;
        cashierPunches.forEach(punch => {
          if (punch.type === 'IN') {
            lastPunchInTime = new Date(punch.time).getTime();
          } else if (punch.type === 'OUT' && lastPunchInTime) {
            const punchOutTime = new Date(punch.time).getTime();
            const hours = (punchOutTime - lastPunchInTime) / (1000 * 60 * 60);
            totals[cashierCode].hours += Math.max(0, hours);
            lastPunchInTime = null;
          }
        });
      });
      return { ...period, data: Object.values(totals).filter(t => t.hours > 0) };
    };

    return {
      current: calculateHours(period1),
      previous: calculateHours(period2),
    };
  }, [punches, cashiers]);

  const handleShowGraph = (period) => {
    const dataForChart = period.data.map(item => ({
      label: item.name,
      value: parseFloat(item.hours.toFixed(2))
    }));
    const maxVal = Math.max(...dataForChart.map(d => d.value), 1);

    setGraphData(dataForChart);
    setMaxHours(maxVal);
    setGraphTitle(`Hours Worked: ${period.title}`);
    setShowGraphModal(true);
  };

  const handleShowShiftDetails = (cashierCode, period) => {
    const cashier = cashiers.find(c => c.code === cashierCode);
    if (!cashier) return;

    const relevantPunches = punches
      .filter(p => p.cashierCode === cashierCode && new Date(p.time) >= period.start && new Date(p.time) < period.end)
      .sort((a, b) => new Date(a.time) - new Date(b.time));

    const shifts = [];
    let lastPunchIn = null;
    relevantPunches.forEach(punch => {
      if (punch.type === 'IN') {
        lastPunchIn = punch;
      } else if (punch.type === 'OUT' && lastPunchIn) {
        const duration = (new Date(punch.time).getTime() - new Date(lastPunchIn.time).getTime()) / (1000 * 60 * 60);
        shifts.push({
          id: lastPunchIn.id,
          date: new Date(lastPunchIn.time).toLocaleDateString(),
          in: new Date(lastPunchIn.time).toLocaleTimeString(),
          out: new Date(punch.time).toLocaleTimeString(),
          duration: duration.toFixed(2),
        });
        lastPunchIn = null;
      }
    });

    setSelectedCashierShifts({ cashierName: cashier.name, shifts });
    setShowShiftDetailModal(true);
  };

  const handleShowAllPunches = () => {
    const allRelevantPunches = punches
      .filter(p => {
        const punchTime = new Date(p.time);
        return (punchTime >= payrollData.current.start && punchTime < payrollData.current.end) ||
               (punchTime >= payrollData.previous.start && punchTime < payrollData.previous.end);
      })
      .sort((a, b) => new Date(a.time) - new Date(b.time))
      .map(p => ({
        ...p,
        cashierName: cashiers.find(c => c.code === p.cashierCode)?.name || 'Unknown'
      }));
    setAllPunchesForPeriod(allRelevantPunches);
    setShowAllPunchesModal(true);
  };

  const renderPeriod = (period) => (
    <View style={{ marginBottom: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.subtitle, { color: colors.text }]}>{period.title}</Text>
        <TouchableOpacity onPress={() => handleShowGraph(period)}>
          <MaterialIcons name="bar-chart" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      {period.data.length > 0 ? period.data.map(item => (
        <TouchableOpacity key={item.name} onPress={() => handleShowShiftDetails(item.code, period)}>
            <View style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
              <Text style={[styles.listItemText, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.listItemText, { color: colors.text }]}>{item.hours.toFixed(2)} hours</Text>
            </View>
        </TouchableOpacity>
      )) : <Text style={[styles.listItemText, { color: colors.text }]}>No hours recorded for this period.</Text>}
    </View>
  );

  return (
    <ScrollView style={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Payroll Summary</Text>
      {renderPeriod(payrollData.current)}
      {renderPeriod(payrollData.previous)}
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgTertiary }]}
        onPress={handleShowAllPunches}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>View All Punch Activity</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: colors.buttonBgPrimary }]}
        onPress={exportPunchesAsCsv}
      >
        <Text style={[styles.buttonText, { color: colors.headerText }]}>Export All Punches (CSV)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.buttonBgSecondary }]} onPress={showTimeClockView}>
        <Text style={[styles.backButtonText, { color: colors.headerText }]}>{'< Back to Time Clock'}</Text>
      </TouchableOpacity>

      <SimpleBarChartModal
        isVisible={showGraphModal}
        onClose={() => setShowGraphModal(false)}
        data={graphData}
        maxValue={maxHours}
        colors={colors}
        title={graphTitle}
      />
      <ShiftDetailModal
        isVisible={showShiftDetailModal}
        onClose={() => setShowShiftDetailModal(false)}
        data={selectedCashierShifts}
        colors={colors}
      />
      <AllPunchesModal
        isVisible={showAllPunchesModal}
        onClose={() => setShowAllPunchesModal(false)}
        punches={allPunchesForPeriod}
        colors={colors}
      />
    </ScrollView>
  );
};

// --- Edit Layaway Balance Modal Component ---
const EditLayawayBalanceModal = ({ isVisible, onClose, onSave, item, colors }) => {
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    if (item) {
      setNewBalance(String(item.remainingBalance.toFixed(2)));
    }
  }, [item]);

  if (!item) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.centeredView}
      >
        <View style={[styles.modalView, { backgroundColor: colors.cardBg }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Balance</Text>
          <Text style={[styles.modalSubtitle, { color: colors.text }]}>
            Item: {item.item}
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.logDetails, fontSize: 14 }]}>
            Original Price: ${item.originalPrice.toFixed(2)}
          </Text>

          <TextInput
            style={[styles.modalInput, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
            placeholder="New Remaining Balance"
            placeholderTextColor={colors.logDetails}
            keyboardType="numeric"
            value={newBalance}
            onChangeText={setNewBalance}
          />

          <View style={styles.modalActionButtons}>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgDanger }]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalActionButton, { backgroundColor: colors.buttonBgPrimary }]}
              onPress={() => onSave(item, newBalance)}
            >
              <Text style={[styles.buttonText, { color: colors.headerText }]}>Save New Balance</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// --- Shift Detail Modal Component ---
const ShiftDetailModal = ({ isVisible, onClose, data, colors }) => {
  const { cashierName, shifts } = data;
  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.cardBg, maxHeight: '80%' }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{cashierName}'s Shifts</Text>
          <FlatList
            style={{ width: '100%' }}
            data={shifts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
                <View>
                  <Text style={[styles.listItemText, { color: colors.text, fontWeight: 'bold' }]}>{item.date}</Text>
                  <Text style={{ color: colors.logDetails }}>In: {item.in}, Out: {item.out}</Text>
                </View>
                <Text style={[styles.listItemText, { color: colors.text }]}>{item.duration} hrs</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={[styles.listItemText, { color: colors.text, textAlign: 'center' }]}>No completed shifts in this period.</Text>}
          />
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary, marginTop: 20, width: '100%' }]} onPress={onClose}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// --- All Punches Modal Component ---
const AllPunchesModal = ({ isVisible, onClose, punches, colors }) => {
  return (
    <Modal visible={isVisible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.centeredView}>
        <View style={[styles.modalView, { backgroundColor: colors.cardBg, maxHeight: '80%' }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>All Punch Activity</Text>
          <Text style={[styles.modalSubtitle, { color: colors.text, fontSize: 14 }]}>Current & Previous Pay Periods</Text>
          <FlatList
            style={{ width: '100%' }}
            data={punches}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.listItem, { borderBottomColor: colors.logEntryBorder }]}>
                <View>
                  <Text style={[styles.listItemText, { color: colors.text, fontWeight: 'bold' }]}>{item.cashierName} - {item.type}</Text>
                  <Text style={{ color: colors.logDetails }}>{new Date(item.time).toLocaleString()}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={<Text style={[styles.listItemText, { color: colors.text, textAlign: 'center' }]}>No punches in these periods.</Text>}
          />
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.buttonBgSecondary, marginTop: 20, width: '100%' }]} onPress={onClose}>
            <Text style={[styles.buttonText, { color: colors.headerText }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingVertical: 15,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  devButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  devButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerIconButton: {
    padding: 8,
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
    textAlign: 'center',
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
  footerButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2,
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
    marginRight: 2.5,
  },
  plusOneButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 2.5,
  },
  cancelSaleButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginLeft: 2.5,
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
  pickerButtonText: {
    fontSize: 14,
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
    width: '100%',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 10,
    width: '48%',
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
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: 10,
    minHeight: 200,
  },
  barWrapper: {
    alignItems: 'center',
    marginHorizontal: 5,
  },
  bar: {
    width: 30,
    borderRadius: 5,
  },
  barValue: {
    fontSize: 12,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  barLabel: {
    fontSize: 10,
    marginTop: 5,
    textAlign: 'center',
    maxWidth: 60,
  },
  chartScrollViewContent: {
    alignItems: 'flex-end',
  },
  chartNoDataText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  inventoryManagementButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  inventoryManagementButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  graphButton: {
    paddingVertical: 10,
  },
  timeClockButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  timeClockButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  timeClockPunchItem: {
    padding: 10,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashierSelectNavButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    width: '100%',
  },
  dateTimePickerContainer: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
  },
  pickerColumn: {
    alignItems: 'center',
    marginHorizontal: 2,
  },
  picker: {
    height: 120,
    width: 60,
    borderWidth: 1,
    borderRadius: 5,
  },
  pickerItem: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  ampmButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginVertical: 2,
    alignItems: 'center',
  },
});

export default App;
