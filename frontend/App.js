import React, { useState, createContext, useContext, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { enableScreens } from 'react-native-screens';

// Enable screens optimization
enableScreens();

// --- src/constants/Colors.js ---
const Colors = {
  primary: '#FF6347', // Tomato red
  secondary: '#FFD700', // Gold
  text: '#333333',
  background: '#F5F5F5',
  cardBackground: '#FFFFFF',
  border: '#E0E0E0',
  success: '#28A745',
  danger: '#DC3545',
  grey: '#6C757D',
};

// --- src/constants/mockData.js ---
const mockRestaurants = [
  {
    id: '1',
    name: 'Burger Haven',
    cuisine: 'American',
    rating: 4.5,
    deliveryTime: '30-45 min',
    image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg',
    description: 'Classic burgers and fries for every craving.',
    address: '123 Burger St, Foodie City',
  },
  {
    id: '2',
    name: 'Pizza Palace',
    cuisine: 'Italian',
    rating: 4.8,
    deliveryTime: '25-40 min',
    image: 'https://cdn.pixabay.com/photo/2017/12/10/14/47/pizza-3010062_1280.jpg',
    description: 'Authentic Italian pizzas baked fresh to order.',
    address: '456 Pizza Ave, Foodie City',
  },
  {
    id: '3',
    name: 'Sushi Spot',
    cuisine: 'Japanese',
    rating: 4.6,
    deliveryTime: '40-55 min',
    image: 'https://cdn.pixabay.com/photo/2017/02/15/15/17/sushi-2069771_1280.jpg',
    description: 'Fresh sushi rolls and sashimi.',
    address: '789 Sushi Blvd, Foodie City',
  },
  {
    id: '4',
    name: 'Taco Town',
    cuisine: 'Mexican',
    rating: 4.3,
    deliveryTime: '35-50 min',
    image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/taco-1238245_1280.jpg',
    description: 'Spicy and flavorful tacos, burritos, and more.',
    address: '101 Taco Rd, Foodie City',
  },
  {
    id: '5',
    name: 'Green Garden',
    cuisine: 'Healthy',
    rating: 4.7,
    deliveryTime: '20-30 min',
    image: 'https://cdn.pixabay.com/photo/2017/01/10/19/46/salad-1969698_1280.jpg',
    description: 'Fresh salads, smoothies, and vegetarian delights.',
    address: '202 Veggie Ln, Foodie City',
  },
];

const mockMenuItems = {
  '1': [ // Burger Haven
    { id: '101', name: 'Classic Cheeseburger', description: 'Beef patty, cheese, lettuce, tomato, onion', price: 12.99, image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_1280.jpg' },
    { id: '102', name: 'Bacon Burger', description: 'Beef patty, bacon, cheese, BBQ sauce', price: 14.99, image: 'https://cdn.pixabay.com/photo/2016/06/15/19/07/hamburger-1459496_1280.jpg' },
    { id: '103', name: 'Veggie Burger', description: 'Plant-based patty, avocado, special sauce', price: 11.99, image: 'https://cdn.pixabay.com/photo/2017/03/09/16/07/burger-2130790_1280.jpg' },
    { id: '104', name: 'French Fries', description: 'Crispy golden fries', price: 4.99, image: 'https://cdn.pixabay.com/photo/2016/11/20/09/06/french-fries-1842183_1280.jpg' },
    { id: '105', name: 'Milkshake', description: 'Chocolate, Vanilla, Strawberry', price: 5.99, image: 'https://cdn.pixabay.com/photo/2016/06/23/16/02/milkshake-1475739_1280.jpg' },
  ],
  '2': [ // Pizza Palace
    { id: '201', name: 'Margherita Pizza', description: 'Tomato, mozzarella, basil', price: 15.99, image: 'https://cdn.pixabay.com/photo/2017/12/10/14/47/pizza-3010062_1280.jpg' },
    { id: '202', name: 'Pepperoni Pizza', description: 'Pepperoni, mozzarella, tomato sauce', price: 17.99, image: 'https://cdn.pixabay.com/photo/2016/05/24/13/29/pizza-1414420_1280.jpg' },
    { id: '203', name: 'Veggie Supreme', description: 'Mushrooms, peppers, onions, olives', price: 16.99, image: 'https://cdn.pixabay.com/photo/2017/01/05/14/40/pizza-1954644_1280.jpg' },
    { id: '204', name: 'Garlic Bread', description: 'Toasted bread with garlic butter', price: 6.99, image: 'https://cdn.pixabay.com/photo/2018/06/05/17/04/garlic-bread-3456385_1280.jpg' },
  ],
  '3': [ // Sushi Spot
    { id: '301', name: 'Salmon Nigiri', description: 'Fresh salmon on rice (2 pcs)', price: 7.50, image: 'https://cdn.pixabay.com/photo/2017/02/15/15/17/sushi-2069771_1280.jpg' },
    { id: '302', name: 'California Roll', description: 'Crab, avocado, cucumber (8 pcs)', price: 9.00, image: 'https://cdn.pixabay.com/photo/2018/05/11/17/37/sushi-3391745_1280.jpg' },
    { id: '303', name: 'Spicy Tuna Roll', description: 'Spicy tuna, cucumber (8 pcs)', price: 10.50, image: 'https://cdn.pixabay.com/photo/2017/07/28/19/33/sushi-2550186_1280.jpg' },
    { id: '304', name: 'Miso Soup', description: 'Traditional Japanese soup', price: 3.99, image: 'https://cdn.pixabay.com/photo/2016/03/05/20/00/miso-soup-1238965_1280.jpg' },
  ],
  '4': [ // Taco Town
    { id: '401', name: 'Chicken Tacos', description: 'Grilled chicken, salsa, lettuce (3 pcs)', price: 9.50, image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/taco-1238245_1280.jpg' },
    { id: '402', name: 'Beef Burrito', description: 'Seasoned beef, rice, beans, cheese', price: 11.00, image: 'https://cdn.pixabay.com/photo/2018/04/18/16/24/burrito-3331238_1280.jpg' },
    { id: '403', name: 'Quesadilla', description: 'Melted cheese, choice of chicken or veggies', price: 8.50, image: 'https://cdn.pixabay.com/photo/2018/08/25/11/38/quesadilla-3629470_1280.jpg' },
  ],
  '5': [ // Green Garden
    { id: '501', name: 'Caesar Salad', description: 'Romaine, croutons, parmesan, Caesar dressing', price: 10.99, image: 'https://cdn.pixabay.com/photo/2017/01/10/19/46/salad-1969698_1280.jpg' },
    { id: '502', name: 'Quinoa Bowl', description: 'Quinoa, roasted vegetables, chickpeas, tahini dressing', price: 12.50, image: 'https://cdn.pixabay.com/photo/2016/12/06/17/30/quinoa-1887363_1280.jpg' },
    { id: '503', name: 'Berry Smoothie', description: 'Mixed berries, banana, almond milk', price: 6.99, image: 'https://cdn.pixabay.com/photo/2017/06/07/11/04/smoothie-2380590_1280.jpg' },
  ],
};

const mockOrders = [
  {
    id: 'ORD001',
    restaurant: 'Burger Haven',
    date: '2023-10-26',
    total: 28.97,
    status: 'Delivered',
    items: [
      { name: 'Classic Cheeseburger', quantity: 1, price: 12.99 },
      { name: 'French Fries', quantity: 2, price: 4.99 },
      { name: 'Milkshake', quantity: 1, price: 5.99 },
    ],
  },
  {
    id: 'ORD002',
    restaurant: 'Pizza Palace',
    date: '2023-10-25',
    total: 34.98,
    status: 'Delivered',
    items: [
      { name: 'Pepperoni Pizza', quantity: 1, price: 17.99 },
      { name: 'Margherita Pizza', quantity: 1, price: 15.99 },
    ],
  },
  {
    id: 'ORD003',
    restaurant: 'Sushi Spot',
    date: '2023-10-27',
    total: 27.00,
    status: 'In Progress',
    items: [
      { name: 'Salmon Nigiri', quantity: 2, price: 7.50 },
      { name: 'California Roll', quantity: 1, price: 9.00 },
      { name: 'Miso Soup', quantity: 1, price: 3.99 },
    ],
  },
];

// --- src/components/Button.js ---
const Button = ({ title, onPress, style, textStyle, type = 'primary', disabled = false }) => {
  const buttonStyles = [styles.button, style];
  const buttonTextStyles = [styles.buttonText, textStyle];

  if (type === 'secondary') {
    buttonStyles.push(styles.secondaryButton);
    buttonTextStyles.push(styles.secondaryButtonText);
  } else if (type === 'danger') {
    buttonStyles.push(styles.dangerButton);
    buttonTextStyles.push(styles.dangerButtonText);
  }

  if (disabled) {
    buttonStyles.push(styles.disabledButton);
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <Text style={buttonTextStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
  },
  buttonText: {
    color: Colors.cardBackground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  secondaryButtonText: {
    color: Colors.primary,
  },
  dangerButton: {
    backgroundColor: Colors.danger,
  },
  dangerButtonText: {
    color: Colors.cardBackground,
  },
  disabledButton: {
    backgroundColor: Colors.grey,
  },
});

// --- src/components/RestaurantCard.js ---
const RestaurantCard = ({ restaurant, onPress }) => {
  return (
    <TouchableOpacity style={restaurantCardStyles.card} onPress={() => onPress(restaurant)}>
      <Image source={{ uri: restaurant.image }} style={restaurantCardStyles.image} />
      <View style={restaurantCardStyles.infoContainer}>
        <Text style={restaurantCardStyles.name}>{restaurant.name}</Text>
        <Text style={restaurantCardStyles.cuisine}>{restaurant.cuisine}</Text>
        <View style={restaurantCardStyles.ratingContainer}>
          <Icon name="star" size={16} color={Colors.secondary} />
          <Text style={restaurantCardStyles.rating}>{restaurant.rating}</Text>
          <Text style={restaurantCardStyles.deliveryTime}> • {restaurant.deliveryTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const restaurantCardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  cuisine: {
    fontSize: 14,
    color: Colors.grey,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 14,
    color: Colors.grey,
  },
});

// --- src/components/MenuItem.js ---
const MenuItem = ({ item, onAddToCart }) => {
  return (
    <View style={menuItemStyles.container}>
      <Image source={{ uri: item.image }} style={menuItemStyles.image} />
      <View style={menuItemStyles.details}>
        <Text style={menuItemStyles.name}>{item.name}</Text>
        <Text style={menuItemStyles.description}>{item.description}</Text>
        <Text style={menuItemStyles.price}>${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={menuItemStyles.addButton} onPress={() => onAddToCart(item)}>
        <Icon name="plus" size={24} color={Colors.cardBackground} />
      </TouchableOpacity>
    </View>
  );
};

const menuItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    alignItems: 'center',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
    margin: 10,
  },
  details: {
    flex: 1,
    paddingRight: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: Colors.grey,
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
});

// --- src/components/CartIcon.js ---
const CartIcon = () => {
  const navigation = useNavigation();
  const { cartItems } = useContext(CartContext);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity
      style={cartIconStyles.container}
      onPress={() => navigation.navigate('Cart')}
    >
      <Icon name="cart" size={26} color={Colors.text} />
      {totalItems > 0 && (
        <View style={cartIconStyles.badge}>
          <Text style={cartIconStyles.badgeText}>{totalItems}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const cartIconStyles = StyleSheet.create({
  container: {
    marginRight: 15,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.cardBackground,
  },
  badgeText: {
    color: Colors.cardBackground,
    fontSize: 12,
    fontWeight: 'bold',
  },
});


// --- src/context/CartContext.js ---
const CartContext = createContext();

const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item, restaurantId, restaurantName) => {
    setCartItems((prevItems) => {
      // Check if item from another restaurant is in cart
      if (prevItems.length > 0 && prevItems[0].restaurantId !== restaurantId) {
        Alert.alert(
          'Different Restaurant',
          'Your cart contains items from another restaurant. Do you want to clear the cart and add this item?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Clear Cart & Add',
              onPress: () => {
                setCartItems([{ ...item, quantity: 1, restaurantId, restaurantName }]);
              },
            },
          ],
          { cancelable: false }
        );
        return prevItems; // Return previous items until user decides
      }

      const existingItem = prevItems.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
        );
      } else {
        return [...prevItems, { ...item, quantity: 1, restaurantId, restaurantName }];
      }
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) => (item.id === itemId ? { ...item, quantity: quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cartItems]);

  const getCartRestaurantInfo = useMemo(() => {
    if (cartItems.length > 0) {
      return {
        id: cartItems[0].restaurantId,
        name: cartItems[0].restaurantName,
      };
    }
    return null;
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateItemQuantity,
        clearCart,
        cartTotal,
        getCartRestaurantInfo,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};


// --- src/screens/Auth/LoginScreen.js ---
const LoginScreen = ({ navigation, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (email === 'user@example.com' && password === 'password') {
      onLogin(); // Call the prop function to update auth state in App.js
    } else {
      Alert.alert('Login Failed', 'Invalid email or password.');
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <View style={authStyles.innerContainer}>
        <Text style={authStyles.title}>FoodieFlow</Text>
        <TextInput
          style={authStyles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={Colors.grey}
        />
        <TextInput
          style={authStyles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={Colors.grey}
        />
        <Button title="Login" onPress={handleLogin} />
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={authStyles.linkText}>Don't have an account? Register</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const authStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerContainer: {
    width: '85%',
    padding: 20,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    height: 50,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: Colors.text,
  },
  linkText: {
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 15,
    fontSize: 15,
  },
});

// --- src/screens/Auth/RegisterScreen.js ---
const RegisterScreen = ({ navigation, onRegister }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleRegister = () => {
    if (name && email && password) {
      Alert.alert('Success', 'Account created! Please log in.');
      onRegister(); // Simulate successful registration and navigate back to login
      navigation.goBack();
    } else {
      Alert.alert('Error', 'Please fill in all fields.');
    }
  };

  return (
    <SafeAreaView style={authStyles.container}>
      <View style={authStyles.innerContainer}>
        <Text style={authStyles.title}>Register</Text>
        <TextInput
          style={authStyles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          placeholderTextColor={Colors.grey}
        />
        <TextInput
          style={authStyles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={Colors.grey}
        />
        <TextInput
          style={authStyles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={Colors.grey}
        />
        <Button title="Register" onPress={handleRegister} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={authStyles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};


// --- src/screens/Main/HomeScreen.js ---
const HomeScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRestaurants = mockRestaurants.filter(restaurant =>
    restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    restaurant.cuisine.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRestaurantPress = (restaurant) => {
    navigation.navigate('RestaurantDetail', { restaurant });
  };

  return (
    <SafeAreaView style={homeScreenStyles.container}>
      <TextInput
        style={homeScreenStyles.searchBar}
        placeholder="Search restaurants..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={Colors.grey}
      />
      <FlatList
        data={filteredRestaurants}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RestaurantCard restaurant={item} onPress={handleRestaurantPress} />
        )}
        contentContainerStyle={homeScreenStyles.listContent}
      />
    </SafeAreaView>
  );
};

const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchBar: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    margin: 16,
    fontSize: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    color: Colors.text,
  },
  listContent: {
    paddingBottom: 20,
  },
});

// --- src/screens/Main/RestaurantDetailScreen.js ---
const RestaurantDetailScreen = ({ route, navigation }) => {
  const { restaurant } = route.params;
  const menuItems = mockMenuItems[restaurant.id] || [];
  const { addToCart, cartItems, getCartRestaurantInfo } = useContext(CartContext);
  const totalItemsInCart = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: restaurant.name,
      headerRight: () => <CartIcon />,
    });
  }, [navigation, restaurant.name, cartItems]);

  const handleAddToCart = (item) => {
    // Check if item is from a different restaurant
    if (getCartRestaurantInfo && getCartRestaurantInfo.id !== restaurant.id) {
      Alert.alert(
        'Clear Cart?',
        `Your cart currently contains items from ${getCartRestaurantInfo.name}. Do you want to clear your cart and add this item from ${restaurant.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear & Add',
            onPress: () => {
              // CartContext handles the clear & add logic
              addToCart(item, restaurant.id, restaurant.name);
            },
          },
        ]
      );
    } else {
      addToCart(item, restaurant.id, restaurant.name);
    }
  };

  return (
    <SafeAreaView style={restaurantDetailStyles.container}>
      <ScrollView contentContainerStyle={restaurantDetailStyles.scrollContent}>
        <Image source={{ uri: restaurant.image }} style={restaurantDetailStyles.restaurantImage} />
        <View style={restaurantDetailStyles.infoContainer}>
          <Text style={restaurantDetailStyles.restaurantName}>{restaurant.name}</Text>
          <Text style={restaurantDetailStyles.restaurantCuisine}>{restaurant.cuisine}</Text>
          <View style={restaurantDetailStyles.ratingDelivery}>
            <Icon name="star" size={18} color={Colors.secondary} />
            <Text style={restaurantDetailStyles.ratingText}>{restaurant.rating}</Text>
            <Text style={restaurantDetailStyles.deliveryText}> • {restaurant.deliveryTime}</Text>
          </View>
          <Text style={restaurantDetailStyles.description}>{restaurant.description}</Text>
        </View>

        <Text style={restaurantDetailStyles.menuHeader}>Menu</Text>
        {menuItems.map((item) => (
          <MenuItem key={item.id} item={item} onAddToCart={() => handleAddToCart(item)} />
        ))}
      </ScrollView>

      {totalItemsInCart > 0 && (
        <TouchableOpacity
          style={restaurantDetailStyles.viewCartButton}
          onPress={() => navigation.navigate('Cart')}
        >
          <Text style={restaurantDetailStyles.viewCartButtonText}>
            View Cart ({totalItemsInCart} items)
          </Text>
          <Icon name="arrow-right" size={20} color={Colors.cardBackground} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const restaurantDetailStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  restaurantImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  infoContainer: {
    backgroundColor: Colors.cardBackground,
    padding: 16,
    marginHorizontal: 16,
    marginTop: -30, // Overlap with image
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    marginBottom: 20,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 16,
    color: Colors.grey,
    marginBottom: 8,
  },
  ratingDelivery: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 5,
  },
  deliveryText: {
    fontSize: 16,
    color: Colors.grey,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  menuHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  viewCartButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 5,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  viewCartButtonText: {
    color: Colors.cardBackground,
    fontSize: 18,
    fontWeight: 'bold',
  },
});


// --- src/screens/Main/CartScreen.js ---
const CartScreen = ({ navigation }) => {
  const { cartItems, updateItemQuantity, removeFromCart, cartTotal, getCartRestaurantInfo } = useContext(CartContext);

  const renderCartItem = ({ item }) => (
    <View style={cartScreenStyles.cartItem}>
      <Image source={{ uri: item.image }} style={cartScreenStyles.itemImage} />
      <View style={cartScreenStyles.itemDetails}>
        <Text style={cartScreenStyles.itemName}>{item.name}</Text>
        <Text style={cartScreenStyles.itemPrice}>${item.price.toFixed(2)}</Text>
      </View>
      <View style={cartScreenStyles.quantityControl}>
        <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity - 1)}>
          <Icon name="minus-circle" size={26} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={cartScreenStyles.itemQuantity}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateItemQuantity(item.id, item.quantity + 1)}>
          <Icon name="plus-circle" size={26} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => removeFromCart(item.id)} style={cartScreenStyles.removeButton}>
        <Icon name="delete-outline" size={24} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={cartScreenStyles.container}>
      {getCartRestaurantInfo && (
        <View style={cartScreenStyles.restaurantInfo}>
          <Text style={cartScreenStyles.restaurantName}>Ordering from:</Text>
          <Text style={cartScreenStyles.restaurantNameValue}>{getCartRestaurantInfo.name}</Text>
        </View>
      )}

      {cartItems.length === 0 ? (
        <View style={cartScreenStyles.emptyCartContainer}>
          <Icon name="cart-off" size={80} color={Colors.grey} style={cartScreenStyles.emptyCartIcon} />
          <Text style={cartScreenStyles.emptyCartText}>Your cart is empty!</Text>
          <Button
            title="Start Ordering"
            onPress={() => navigation.navigate('Home')}
            style={cartScreenStyles.emptyCartButton}
          />
        </View>
      ) : (
        <FlatList
          data={cartItems}
          keyExtractor={(item) => item.id}
          renderItem={renderCartItem}
          contentContainerStyle={cartScreenStyles.listContent}
        />
      )}

      {cartItems.length > 0 && (
        <View style={cartScreenStyles.footer}>
          <View style={cartScreenStyles.totalContainer}>
            <Text style={cartScreenStyles.totalText}>Subtotal:</Text>
            <Text style={cartScreenStyles.totalAmount}>${cartTotal.toFixed(2)}</Text>
          </View>
          <Button
            title={`Proceed to Checkout ($${cartTotal.toFixed(2)})`}
            onPress={() => navigation.navigate('Checkout')}
            style={cartScreenStyles.checkoutButton}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const cartScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  restaurantInfo: {
    flexDirection: 'row',
    backgroundColor: Colors.cardBackground,
    padding: 15,
    margin: 16,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  restaurantName: {
    fontSize: 16,
    color: Colors.grey,
    marginRight: 5,
  },
  restaurantNameValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.grey,
    marginTop: 2,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginHorizontal: 10,
  },
  removeButton: {
    padding: 5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.cardBackground,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalText: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: 'bold',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  checkoutButton: {
    width: '100%',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCartIcon: {
    marginBottom: 20,
  },
  emptyCartText: {
    fontSize: 20,
    color: Colors.grey,
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyCartButton: {
    width: '60%',
  },
});

// --- src/screens/Main/CheckoutScreen.js ---
const CheckoutScreen = ({ navigation }) => {
  const { cartItems, cartTotal, clearCart, getCartRestaurantInfo } = useContext(CartContext);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  const handlePlaceOrder = () => {
    if (!address) {
      Alert.alert('Address Required', 'Please enter your delivery address.');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Your cart is empty. Please add items before checking out.');
      return;
    }

    Alert.alert(
      'Order Placed!',
      `Your order for $${cartTotal.toFixed(2)} from ${getCartRestaurantInfo.name} has been placed. It will be delivered to ${address}.`,
      [
        {
          text: 'OK',
          onPress: () => {
            clearCart();
            navigation.popToTop(); // Go back to Home
            navigation.navigate('OrdersStack', { screen: 'Orders' }); // Navigate to Orders tab
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={checkoutStyles.container}>
      <ScrollView contentContainerStyle={checkoutStyles.scrollContent}>
        <Text style={checkoutStyles.sectionTitle}>Delivery Details</Text>
        <TextInput
          style={checkoutStyles.input}
          placeholder="Delivery Address"
          value={address}
          onChangeText={setAddress}
          multiline
          numberOfLines={3}
          placeholderTextColor={Colors.grey}
        />

        <Text style={checkoutStyles.sectionTitle}>Payment Method</Text>
        <TouchableOpacity style={checkoutStyles.paymentOption}>
          <Icon
            name={paymentMethod === 'Credit Card' ? 'radiobox-marked' : 'radiobox-blank'}
            size={24}
            color={Colors.primary}
          />
          <Text style={checkoutStyles.paymentText}>Credit Card</Text>
        </TouchableOpacity>
        <TouchableOpacity style={checkoutStyles.paymentOption}>
          <Icon
            name={paymentMethod === 'Cash on Delivery' ? 'radiobox-marked' : 'radiobox-blank'}
            size={24}
            color={Colors.primary}
          />
          <Text style={checkoutStyles.paymentText}>Cash on Delivery</Text>
        </TouchableOpacity>

        <Text style={checkoutStyles.sectionTitle}>Order Summary</Text>
        <View style={checkoutStyles.summaryCard}>
          {cartItems.map((item) => (
            <View key={item.id} style={checkoutStyles.summaryItem}>
              <Text style={checkoutStyles.summaryItemName}>{item.quantity} x {item.name}</Text>
              <Text style={checkoutStyles.summaryItemPrice}>${(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
          <View style={checkoutStyles.summaryTotal}>
            <Text style={checkoutStyles.summaryTotalText}>Total</Text>
            <Text style={checkoutStyles.summaryTotalAmount}>${cartTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={checkoutStyles.footer}>
        <Button
          title={`Place Order ($${cartTotal.toFixed(2)})`}
          onPress={handlePlaceOrder}
          disabled={cartItems.length === 0}
        />
      </View>
    </SafeAreaView>
  );
};

const checkoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100, // Ensure content is not hidden by footer
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  input: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    borderColor: Colors.border,
    borderWidth: 1,
    color: Colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  paymentText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 10,
  },
  summaryCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryItemName: {
    fontSize: 15,
    color: Colors.grey,
  },
  summaryItemPrice: {
    fontSize: 15,
    color: Colors.text,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 10,
  },
  summaryTotalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  summaryTotalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.cardBackground,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});

// --- src/screens/Main/OrdersScreen.js ---
const OrdersScreen = () => {
  const renderOrderItem = ({ item }) => (
    <View style={orderStyles.orderCard}>
      <Text style={orderStyles.orderId}>Order #{item.id}</Text>
      <Text style={orderStyles.restaurantName}>{item.restaurant}</Text>
      <Text style={orderStyles.orderDate}>{item.date}</Text>
      <View style={orderStyles.itemsContainer}>
        {item.items.map((food, index) => (
          <Text key={index} style={orderStyles.itemText}>
            • {food.quantity}x {food.name} (${food.price.toFixed(2)})
          </Text>
        ))}
      </View>
      <View style={orderStyles.footerContainer}>
        <Text style={orderStyles.orderTotal}>Total: ${item.total.toFixed(2)}</Text>
        <Text
          style={[
            orderStyles.orderStatus,
            item.status === 'Delivered' ? orderStyles.statusDelivered : orderStyles.statusInProgress,
          ]}
        >
          {item.status}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={orderStyles.container}>
      <FlatList
        data={mockOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={orderStyles.listContent}
      />
    </SafeAreaView>
  );
};

const orderStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  orderCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.grey,
    marginBottom: 5,
  },
  restaurantName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 5,
  },
  orderDate: {
    fontSize: 14,
    color: Colors.grey,
    marginBottom: 10,
  },
  itemsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 10,
  },
  itemText: {
    fontSize: 15,
    color: Colors.text,
    marginBottom: 3,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 5,
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  orderStatus: {
    fontSize: 15,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusDelivered: {
    backgroundColor: Colors.success,
    color: Colors.cardBackground,
  },
  statusInProgress: {
    backgroundColor: Colors.secondary,
    color: Colors.text,
  },
});

// --- src/screens/Main/ProfileScreen.js ---
const ProfileScreen = ({ onLogout }) => {
  const user = {
    name: 'John Doe',
    email: 'user@example.com',
    address: '123 Main St, Foodie City, CA 90210',
    phone: '+1 (555) 123-4567',
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: onLogout, style: 'destructive' },
      ]
    );
  };

  return (
    <SafeAreaView style={profileStyles.container}>
      <ScrollView contentContainerStyle={profileStyles.scrollContent}>
        <View style={profileStyles.header}>
          <Icon name="account-circle" size={100} color={Colors.grey} />
          <Text style={profileStyles.userName}>{user.name}</Text>
          <Text style={profileStyles.userEmail}>{user.email}</Text>
        </View>

        <View style={profileStyles.infoCard}>
          <Text style={profileStyles.cardTitle}>Contact Information</Text>
          <View style={profileStyles.infoRow}>
            <Icon name="map-marker" size={20} color={Colors.grey} />
            <Text style={profileStyles.infoText}>{user.address}</Text>
          </View>
          <View style={profileStyles.infoRow}>
            <Icon name="phone" size={20} color={Colors.grey} />
            <Text style={profileStyles.infoText}>{user.phone}</Text>
          </View>
        </View>

        <View style={profileStyles.infoCard}>
          <Text style={profileStyles.cardTitle}>App Settings</Text>
          <TouchableOpacity style={profileStyles.settingRow}>
            <Text style={profileStyles.settingText}>Notifications</Text>
            <Icon name="chevron-right" size={20} color={Colors.grey} />
          </TouchableOpacity>
          <TouchableOpacity style={profileStyles.settingRow}>
            <Text style={profileStyles.settingText}>Privacy Policy</Text>
            <Icon name="chevron-right" size={20} color={Colors.grey} />
          </TouchableOpacity>
        </View>

        <Button
          title="Logout"
          onPress={handleLogout}
          type="danger"
          style={profileStyles.logoutButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const profileStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    paddingVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.grey,
    marginTop: 5,
  },
  infoCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 10,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingText: {
    fontSize: 16,
    color: Colors.text,
  },
  logoutButton: {
    marginTop: 20,
    width: '100%',
  },
});


// --- src/navigation/AuthNavigator.js ---
const AuthStack = createStackNavigator();

const AuthNavigator = ({ onLogin, onRegister }) => {
  return (
    <AuthStack.Navigator screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: Colors.background },
    }}>
      <AuthStack.Screen name="Login">
        {(props) => <LoginScreen {...props} onLogin={onLogin} />}
      </AuthStack.Screen>
      <AuthStack.Screen name="Register">
        {(props) => <RegisterScreen {...props} onRegister={onRegister} />}
      </AuthStack.Screen>
    </AuthStack.Navigator>
  );
};

// --- src/navigation/HomeStack.js ---
const HomeStack = createStackNavigator();

const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.cardBackground,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <HomeStack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'FoodieFlow',
          headerRight: () => <CartIcon />,
        }}
      />
      <HomeStack.Screen
        name="RestaurantDetail"
        component={RestaurantDetailScreen}
        options={({ route }) => ({
          title: route.params.restaurant.name,
        })}
      />
      <HomeStack.Screen
        name="Cart"
        component={CartScreen}
        options={{ title: 'Your Cart' }}
      />
      <HomeStack.Screen
        name="Checkout"
        component={CheckoutScreen}
        options={{ title: 'Checkout' }}
      />
    </HomeStack.Navigator>
  );
};

// --- src/navigation/OrdersStack.js ---
const OrdersStack = createStackNavigator();

const OrdersStackNavigator = () => {
  return (
    <OrdersStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.cardBackground,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <OrdersStack.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Your Orders' }}
      />
    </OrdersStack.Navigator>
  );
};


// --- src/navigation/ProfileStack.js ---
const ProfileStack = createStackNavigator();

const ProfileStackNavigator = ({ onLogout }) => {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.cardBackground,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}
    >
      <ProfileStack.Screen name="Profile">
        {(props) => <ProfileScreen {...props} onLogout={onLogout} />}
      </ProfileStack.Screen>
    </ProfileStack.Navigator>
  );
};


// --- src/navigation/AppNavigator.js ---
const Tab = createBottomTabNavigator();

const AppNavigator = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'OrdersTab') {
            iconName = focused ? 'format-list-checks' : 'format-list-bulleted';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.grey,
        tabBarStyle: {
          backgroundColor: Colors.cardBackground,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerShown: false, // Hide header for tab navigator itself
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStackNavigator}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen
        name="ProfileTab"
        options={{ title: 'Profile' }}
      >
        {() => <ProfileStackNavigator onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};


// --- App.js ---
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => setIsLoggedIn(true);
  const handleRegister = () => { /* Logic after registration successful */ };
  const handleLogout = () => setIsLoggedIn(false);

  return (
    <CartProvider>
      <NavigationContainer>
        {isLoggedIn ? (
          <AppNavigator onLogout={handleLogout} />
        ) : (
          <AuthNavigator onLogin={handleLogin} onRegister={handleRegister} />
        )}
      </NavigationContainer>
    </CartProvider>
  );
};

export default App;