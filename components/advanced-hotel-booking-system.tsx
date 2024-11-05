"use client";

import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  User,
  LogOut,
  CheckCircle,
  XCircle,
  Search,
  Sun,
  Moon,
  Upload,
  Star,
  Gift,
} from "lucide-react";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import Image from "next/image";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font } from "three/examples/jsm/loaders/FontLoader";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "react-toastify";

// Initialize Firebase (replace with your own config)
const firebaseConfig = {
  apiKey: "AIzaSyBTF86AlYCzaOmxK0VS-GFaWGyloywHRNc",
  authDomain: "sample-firebase-ai-app-c5658.firebaseapp.com",
  databaseURL:
    "https://sample-firebase-ai-app-c5658-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "sample-firebase-ai-app-c5658",
  storageBucket: "sample-firebase-ai-app-c5658.firebasestorage.app",
  messagingSenderId: "126968861559",
  appId: "1:126968861559:web:88587a1bd39502b4d10772",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

interface Branch {
  id: string;
  name: string;
  location?: string;
  isActive?: boolean;
  [key: string]: unknown;
}

interface BookingData {
  roomName: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  userEmail: string;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | { toDate(): Date } | string | number;
  userId: string;
  roomId: string;
  [key: string]: unknown;
}

interface SpecialOffer {
  id: string;
  title: string;
  description: string;
  discount: number;
  [key: string]: unknown;
}

interface ExtendedUser extends FirebaseUser {
  role?: string;
  preferences?: Record<string, unknown>;
  loyaltyPoints?: number;
}

interface Room {
  id: string;
  name: string;
  locationId: string;
  floorNumber: number;
  price: number;
  status: "available" | "occupied" | "maintenance";
  imageUrl?: string;
  [key: string]: unknown;
}

interface ChatMessage {
  userId: string;
  message: string;
  createdAt: Date;
}

interface AuthFormProps {
  onSubmit: (email: string, password: string, role?: string) => void;
  buttonText: string;
  showRoleSelect?: boolean;
  onGoogleSignIn: () => Promise<void>;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: number;
  [key: string]: unknown;
}

function AuthForm({
  onSubmit,
  buttonText,
  showRoleSelect = false,
  onGoogleSignIn,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit(email, password, role);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {showRoleSelect && (
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        )}
        <Button type="submit" className="w-full">
          {buttonText}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={onGoogleSignIn}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </Button>
    </div>
  );
}

export function AdvancedHotelBookingSystemComponent() {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeTab, setActiveTab] = useState("login");
  const [searchParams, setSearchParams] = useState<{
    city: string;
    priceRange: number[];
    amenities: string[];
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
    location?: string;
  }>({
    city: "",
    priceRange: [],
    amenities: [],
    checkIn: null,
    checkOut: null,
    guests: 1,
    location: "",
  });
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [specialOffers, setSpecialOffers] = useState<SpecialOffer[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
    null
  );
  const [hotels, setHotels] = useState<any[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // User is signed in, now safe to query Firestore
        // Your Firestore queries here
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get user data from Firestore
        const userSnapshot = await getDocs(
          query(collection(db, "users"), where("uid", "==", user.uid))
        );

        const userData = userSnapshot.docs[0]?.data();

        setUser({
          ...user,
          role: userData?.role || "customer",
          preferences: userData?.preferences || {},
          loyaltyPoints: userData?.loyaltyPoints || 0,
        } as ExtendedUser);

        if (userData?.loyaltyPoints) {
          setLoyaltyPoints(userData.loyaltyPoints);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    fetchBranches();
    fetchRooms();
    fetchReviews();
    fetchSpecialOffers();
    return () => unsubscribe();
  }, []);

  const fetchBranches = async () => {
    const branchesCollection = collection(db, "branches");
    const branchesSnapshot = await getDocs(branchesCollection);
    const branchesData = branchesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setBranches(branchesData as Branch[]);
  };

  const fetchRooms = async () => {
    const roomsCollection = collection(db, "rooms");
    const roomsSnapshot = await getDocs(roomsCollection);
    const roomsData = roomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setRooms(roomsData as Room[]);
  };

  const fetchBookings = async () => {
    if (user) {
      const bookingsCollection = collection(db, "bookings");
      const q =
        user.role === "admin"
          ? bookingsCollection
          : query(bookingsCollection, where("userId", "==", user.uid));
      const bookingsSnapshot = await getDocs(q);
      const bookingsData = bookingsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings(bookingsData as Booking[]);
    }
  };

  const fetchLoyaltyPoints = async (userId: string) => {
    const userDoc = await getDocs(
      query(collection(db, "users"), where("uid", "==", userId))
    );
    const userData = userDoc.docs[0]?.data();
    setLoyaltyPoints(userData?.loyaltyPoints || 0);
  };

  const fetchReviews = async () => {
    const reviewsCollection = collection(db, "reviews");
    const reviewsSnapshot = await getDocs(
      query(reviewsCollection, orderBy("createdAt", "desc"), limit(10))
    );
    const reviewsData = reviewsSnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Review)
    );
    setReviews(reviewsData as Review[]);
  };

  const fetchSpecialOffers = async () => {
    const offersCollection = collection(db, "specialOffers");
    const offersSnapshot = await getDocs(offersCollection);
    const offersData = offersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setSpecialOffers(offersData as SpecialOffer[]);
  };

  const handleSignUp = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Success! Handle the signed-in user
      const user = userCredential.user;
      // Add any additional logic here
    } catch (error: any) {
      if (error.code === "auth/operation-not-allowed") {
        console.error(
          "Email/Password authentication is not enabled in Firebase Console"
        );
        // Show user-friendly error message
        toast.error("Sign up method is not available. Please contact support.");
      } else {
        console.error("Error signing up:", error);
        toast.error("Failed to create account. Please try again.");
      }
    }
  };

  const handleSignIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error signing in:", error);
    }
  };

  const handleSignOut = () => signOut(auth);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleBooking = async (bookingData: BookingData) => {
    if (!user) return;

    try {
      await addDoc(collection(db, "bookings"), {
        ...bookingData,
        userId: user.uid,
        status: "Pending",
      });
      await sendEmailNotification(
        user.email ?? "no-email",
        "Booking Confirmation",
        `Your booking for ${bookingData.roomName} has been received and is pending confirmation.`
      );
      await updateLoyaltyPoints(user.uid, 100);
      fetchBookings();
    } catch (error) {
      console.error("Error adding booking:", error);
    }
  };

  const handleUpdateBooking = async (
    id: string,
    status: "Pending" | "Confirmed" | "Cancelled"
  ) => {
    await updateDoc(doc(db, "bookings", id), { status });
    const booking = bookings.find((b) => b.id === id);
    if (
      booking &&
      typeof booking === "object" &&
      "userEmail" in booking &&
      typeof booking.userEmail === "string"
    ) {
      await sendEmailNotification(
        booking.userEmail,
        "Booking Update",
        `Your booking for ${booking.roomName} has been ${status}.`
      );
    }
    fetchBookings();
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
      toast.success("Booking cancelled successfully");
      fetchBookings(); // Refresh the bookings list
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast.error("Failed to cancel booking");
    }
  };

  const handleUpdateProfile = async (profileData: ProfileUpdate) => {
    try {
      if (!user) return;

      // Get reference to user document
      const userRef = doc(db, "users", user.uid);

      // Check if document exists
      const userDoc = await getDocs(
        query(collection(db, "users"), where("uid", "==", user.uid))
      );

      if (userDoc.empty) {
        // Create new user document if it doesn't exist
        await addDoc(collection(db, "users"), {
          uid: user.uid,
          role: "customer",
          preferences: profileData.preferences || {},
          loyaltyPoints: 0,
          email: user.email,
          displayName: profileData.displayName,
          photoURL: user.photoURL,
        });
      } else {
        // Update existing document
        const docId = userDoc.docs[0].id;
        await updateDoc(doc(db, "users", docId), profileData);
      }

      // Update local user state
      setUser((prevUser) =>
        prevUser ? ({ ...prevUser, ...profileData } as ExtendedUser) : null
      );
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", user.uid))
        );
        const userData = userDoc.docs[0]?.data();
        setUser({
          ...user,
          role: userData?.role || "customer",
          preferences: userData?.preferences || {},
        });
        fetchLoyaltyPoints(user.uid);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    fetchBranches();
    fetchRooms();
    fetchReviews();
    fetchSpecialOffers();
    return () => unsubscribe();
  }, []);

  const fetchFilteredRooms = async () => {
    const roomsCollection = collection(db, "rooms");
    let q = query(roomsCollection);

    if (searchParams.location) {
      q = query(q, where("branchId", "==", searchParams.location));
    }

    if (searchParams.guests) {
      q = query(q, where("capacity", ">=", searchParams.guests));
    }

    if (searchParams.priceRange) {
      q = query(
        q,
        where("price", ">=", searchParams.priceRange[0]),
        where("price", "<=", searchParams.priceRange[1])
      );
    }

    if (searchParams.amenities.length > 0) {
      q = query(
        q,
        where("amenities", "array-contains-any", searchParams.amenities)
      );
    }

    const roomsSnapshot = await getDocs(q);
    let filteredRoomsData = roomsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by date availability (this would be more efficient if done server-side)
    if (searchParams.checkIn && searchParams.checkOut) {
      const bookingsCollection = collection(db, "bookings");
      const bookingsSnapshot = await getDocs(bookingsCollection);
      const bookings = bookingsSnapshot.docs.map((doc) => doc.data());

      filteredRoomsData = filteredRoomsData.filter((room) => {
        const roomBookings = bookings.filter(
          (booking) => booking.roomId === room.id
        );
        return !roomBookings.some(
          (booking) =>
            (searchParams.checkIn &&
              searchParams.checkIn >= booking.checkIn &&
              searchParams.checkIn < booking.checkOut) ||
            (searchParams.checkOut &&
              searchParams.checkOut > booking.checkIn &&
              searchParams.checkOut &&
              searchParams.checkOut <= booking.checkOut) ||
            (searchParams.checkIn &&
              searchParams.checkIn <= booking.checkIn &&
              searchParams.checkOut &&
              searchParams.checkOut >= booking.checkOut)
        );
      });
    }

    setFilteredRooms(filteredRoomsData as Room[]);
  };

  const handleSearch = async (params: {
    city: string;
    priceRange: number[];
    amenities: string[];
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
  }) => {
    try {
      // Set loading state if needed
      setIsLoading(true);

      const hotelsRef = collection(db, "hotels");
      let q = query(hotelsRef);

      if (params.city) {
        q = query(q, where("city", "==", params.city));
      }

      const querySnapshot = await getDocs(q);
      const filteredHotels = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update state with new data
      setHotels(filteredHotels);
      console.log("Filtered hotels:", filteredHotels);
    } catch (error) {
      console.error("Error searching hotels:", error);
      toast.error("Failed to load hotels");
    } finally {
      setIsLoading(false);
    }
  };

  const sendEmailNotification = async (
    to: string,
    subject: string,
    body: string
  ) => {
    // Implement email sending logic here (e.g., using a service like SendGrid)
    console.log(`Sending email to ${to}:`, subject, body);
  };

  const handleImageUpload = async (file: File, roomId: string) => {
    try {
      const storageRef = ref(storage, `rooms/${roomId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "rooms", roomId), { imageUrl: downloadURL });
      fetchRooms();
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const updateLoyaltyPoints = async (userId: string, points: number) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      loyaltyPoints: loyaltyPoints + points,
    });
    setLoyaltyPoints((prevPoints) => prevPoints + points);
  };

  const handleAddReview = async (
    roomId: string,
    rating: number,
    comment: string
  ) => {
    try {
      const reviewData = {
        roomId,
        rating,
        comment,
        createdAt: new Date().toISOString(),
        userId: user?.uid,
        userEmail: user?.email,
      };
      await addDoc(collection(db, "reviews"), reviewData);
      fetchReviews();
    } catch (error) {
      console.error("Error adding review:", error);
    }
  };

  const handleSendMessage = async (message: string | null) => {
    try {
      if (!user || !message) return;
      await addDoc(collection(db, "chatMessages"), {
        userId: user.uid,
        message,
        createdAt: new Date(),
      });
      setChatMessages((prevMessages) => [
        ...prevMessages,
        {
          userId: user.uid,
          message,
          createdAt: new Date(),
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user exists in our database
      const userSnapshot = await getDocs(
        query(collection(db, "users"), where("uid", "==", user.uid))
      );

      let userData = { role: "customer", preferences: {}, loyaltyPoints: 0 };

      // If user doesn't exist, create a new user document
      if (userSnapshot.empty) {
        const newUserRef = await addDoc(collection(db, "users"), {
          uid: user.uid,
          ...userData,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        // Get existing user data
        userData = userSnapshot.docs[0].data() as {
          role: string;
          preferences: {};
          loyaltyPoints: number;
        };
      }

      // Set user with role and other data
      setUser({
        ...user,
        role: userData.role,
        preferences: userData.preferences,
        loyaltyPoints: userData.loyaltyPoints,
      } as ExtendedUser);

      toast.success("Successfully signed in!");
    } catch (error) {
      console.error("Error signing in with Google:", error);
      toast.error("Failed to sign in with Google");
    }
  };

  useEffect(() => {
    // Fetch locations from Firestore
    const fetchLocations = async () => {
      const locationsSnapshot = await getDocs(collection(db, "locations"));
      const locationsData = locationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Location[];
      setLocations(locationsData);
      console.log("Locations:", locationsData);
    };

    // Fetch floors from Firestore
    const fetchFloors = async () => {
      const floorsSnapshot = await getDocs(collection(db, "floors"));
      const floorsData = floorsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Floor[];
      setFloors(floorsData);
    };

    fetchLocations();
    fetchFloors();
  }, []);

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId);
  };

  const fetchHotels = async () => {
    try {
      const hotelCollection = collection(db, "hotels");
      const querySnapshot = await getDocs(hotelCollection);

      const hotelData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setHotels([...hotelData]);
      // console.log('Hotels:', hotelData);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      toast.error("Failed to load hotels");
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Hotel Booking System</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user.photoURL ?? ""}
                      alt={user.displayName ?? ""}
                    />
                    <AvatarFallback>
                      {(user?.email ?? "")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem onClick={() => setActiveTab("profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("bookings")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span>My Bookings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActiveTab("loyalty")}>
                  <Gift className="mr-2 h-4 w-4" />
                  <span>Loyalty Program</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </header>

      {!user ? (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Welcome to Luxe Stays</CardTitle>
            <CardDescription>
              Sign in or create an account to start booking luxurious
              accommodations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <AuthForm
                  onSubmit={handleSignIn}
                  buttonText="Sign In"
                  onGoogleSignIn={handleGoogleSignIn}
                />
              </TabsContent>
              <TabsContent value="signup">
                <AuthForm
                  onSubmit={handleSignUp}
                  buttonText="Sign Up"
                  showRoleSelect
                  onGoogleSignIn={handleGoogleSignIn}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            {user?.role === "admin" && (
              <TabsTrigger value="admin">Admin</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="search">
            <SearchForm
              branches={branches}
              rooms={rooms}
              searchParams={searchParams}
              setSearchParams={setSearchParams}
              onSearch={handleSearch}
            />
            <SpecialOffers offers={specialOffers} />
          </TabsContent>
          <TabsContent value="bookings">
            <CustomerBookings
              bookings={bookings as unknown as Booking[]}
              onFetch={fetchBookings}
            />
          </TabsContent>
          <TabsContent value="profile">
            <UserProfile user={user} onUpdateProfile={handleUpdateProfile} />
          </TabsContent>
          <TabsContent value="loyalty">
            <LoyaltyProgram points={loyaltyPoints} />
          </TabsContent>
          <TabsContent value="support">
            <ChatSupport
              messages={chatMessages}
              onSendMessage={handleSendMessage}
            />
          </TabsContent>
          {user?.role === "admin" && (
            <TabsContent value="admin">
              <Card>
                <CardHeader>
                  <CardTitle>Admin Panel</CardTitle>
                  <CardDescription>Manage hotels and bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="add-hotel">
                    <TabsList>
                      <TabsTrigger value="add-hotel">Add Hotel</TabsTrigger>
                      <TabsTrigger value="manage-hotels">
                        Manage Hotels
                      </TabsTrigger>
                      <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    </TabsList>

                    <TabsContent value="add-hotel">
                      <AddHotelForm />
                    </TabsContent>

                    <TabsContent value="manage-hotels">
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Rooms</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {branches.map((branch) => (
                              <TableRow key={branch.id}>
                                <TableCell>{branch.name}</TableCell>
                                <TableCell>
                                  {branch.location || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {
                                    rooms.filter(
                                      (room) => room.locationId === branch.id
                                    ).length
                                  }
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      branch.isActive ? "default" : "secondary"
                                    }
                                  >
                                    {branch.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                          Edit
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Edit Hotel</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                          <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                              htmlFor="name"
                                              className="text-right"
                                            >
                                              Name
                                            </Label>
                                            <Input
                                              id="name"
                                              defaultValue={branch.name}
                                              className="col-span-3"
                                            />
                                          </div>
                                          <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                              htmlFor="location"
                                              className="text-right"
                                            >
                                              Location
                                            </Label>
                                            <Input
                                              id="location"
                                              defaultValue={branch.location}
                                              className="col-span-3"
                                            />
                                          </div>
                                          <div className="grid grid-cols-4 items-center gap-4">
                                            <Label
                                              htmlFor="status"
                                              className="text-right"
                                            >
                                              Status
                                            </Label>
                                            <Switch
                                              id="status"
                                              checked={branch.isActive}
                                              className="col-span-3"
                                            />
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <Button type="submit">
                                            Save changes
                                          </Button>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-500"
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </TabsContent>

                    <TabsContent value="bookings">
                      <ScrollArea className="h-[400px]">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Room</TableHead>
                              <TableHead>User</TableHead>
                              <TableHead>Check-in</TableHead>
                              <TableHead>Check-out</TableHead>
                              <TableHead>Guests</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {bookings.map((booking) => (
                              <TableRow key={booking.id}>
                                <TableCell>{booking.roomName}</TableCell>
                                <TableCell>
                                  {booking.userEmail || "N/A"}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(booking.checkIn), "PPP")}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(booking.checkOut), "PPP")}
                                </TableCell>
                                <TableCell>{booking.guests}</TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      booking.status === "Confirmed"
                                        ? "default"
                                        : "secondary"
                                    }
                                  >
                                    {booking.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex space-x-2">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            onClick={() =>
                                              handleUpdateBooking(
                                                booking.id,
                                                "Confirmed"
                                              )
                                            }
                                            size="sm"
                                            variant="outline"
                                          >
                                            <CheckCircle className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Confirm Booking</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            onClick={() =>
                                              handleDeleteBooking(booking.id)
                                            }
                                            size="sm"
                                            variant="outline"
                                          >
                                            <XCircle className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Cancel Booking</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      )}
      <ReviewSystem reviews={reviews} onAddReview={handleAddReview} />
      <LocationSelector locations={locations} onSelect={handleLocationSelect} />

      {selectedLocationId && (
        <FloorOverview
          floors={floors}
          selectedLocationId={selectedLocationId}
        />
      )}
    </div>
  );
}

interface SearchFormProps {
  branches: Branch[];
  rooms: Room[];
  searchParams: {
    city: string;
    priceRange: number[];
    amenities: string[];
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
    location?: string;
  };
  setSearchParams: React.Dispatch<
    React.SetStateAction<{
      city: string;
      priceRange: number[];
      amenities: string[];
      checkIn: Date | null;
      checkOut: Date | null;
      guests: number;
      location?: string;
    }>
  >;
  onSearch: (params: {
    city: string;
    priceRange: number[];
    amenities: string[];
    checkIn: Date | null;
    checkOut: Date | null;
    guests: number;
  }) => Promise<void>;
}

function SearchForm({
  branches,
  rooms,
  searchParams,
  setSearchParams,
  onSearch,
}: SearchFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Find Your Perfect Stay</CardTitle>
        <CardDescription>
          Search for luxurious accommodations tailored to your preferences.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(searchParams);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                type="text"
                value={searchParams.city}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, city: e.target.value })
                }
                placeholder="Enter city or address..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guests">Number of Guests</Label>
              <Input
                id="guests"
                type="number"
                value={searchParams.guests}
                onChange={(e) =>
                  setSearchParams({
                    ...searchParams,
                    guests: parseInt(e.target.value),
                  })
                }
                min="1"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Check-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !searchParams.checkIn && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchParams.checkIn ? (
                      format(searchParams.checkIn, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                {typeof window !== "undefined" && (
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={
                        searchParams.checkIn
                          ? new Date(searchParams.checkIn)
                          : undefined
                      }
                      onSelect={(date: Date | undefined) =>
                        setSearchParams({
                          ...searchParams,
                          checkIn: date ? date : null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                )}
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Check-out Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !searchParams.checkOut && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {searchParams.checkOut ? (
                      format(searchParams.checkOut, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={
                      searchParams.checkOut
                        ? new Date(searchParams.checkOut)
                        : undefined
                    }
                    onSelect={(date) =>
                      setSearchParams({
                        ...searchParams,
                        checkOut: date ? date : null,
                      })
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Price Range</Label>
            <Slider
              min={0}
              max={1000}
              step={10}
              value={searchParams.priceRange}
              onValueChange={(value: number[]) =>
                setSearchParams({ ...searchParams, priceRange: value })
              }
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>${searchParams.priceRange[0]}</span>
              <span>${searchParams.priceRange[1]}</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-2">
              {["WiFi", "Parking", "Pool", "Gym"].map((amenity) => (
                <div key={amenity} className="flex items-center space-x-2">
                  <Switch
                    id={amenity}
                    checked={searchParams.amenities.includes(amenity)}
                    onCheckedChange={(checked) => {
                      const newAmenities = checked
                        ? [...searchParams.amenities, amenity]
                        : searchParams.amenities.filter((a) => a !== amenity);
                      setSearchParams({
                        ...searchParams,
                        amenities: newAmenities,
                      });
                    }}
                  />
                  <Label htmlFor={amenity}>{amenity}</Label>
                </div>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Search Rooms
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface Booking {
  id: string;
  roomName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: string;
  userEmail?: string;
}

function CustomerBookings({
  bookings,
  onFetch,
}: {
  bookings: Booking[];
  onFetch: () => void;
}) {
  useEffect(() => {
    onFetch();
  }, [onFetch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Bookings</CardTitle>
        <CardDescription>
          View and manage your current reservations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <p>You have no bookings yet.</p>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>{booking.roomName}</TableCell>
                    <TableCell>
                      {format(new Date(booking.checkIn), "PPP")}
                    </TableCell>
                    <TableCell>
                      {format(new Date(booking.checkOut), "PPP")}
                    </TableCell>
                    <TableCell>{booking.guests}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.status === "Confirmed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                Room
                              </Label>
                              <div className="col-span-3">
                                {booking.roomName}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="username" className="text-right">
                                Dates
                              </Label>
                              <div className="col-span-3">
                                {format(new Date(booking.checkIn), "PPP")} -{" "}
                                {format(new Date(booking.checkOut), "PPP")}
                              </div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="username" className="text-right">
                                Guests
                              </Label>
                              <div className="col-span-3">{booking.guests}</div>
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="username" className="text-right">
                                Status
                              </Label>
                              <div className="col-span-3">
                                <Badge
                                  variant={
                                    booking.status === "Confirmed"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {booking.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit">Print</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

interface ProfileUpdate {
  displayName?: string;
  preferences?: Record<string, unknown>;
  [key: string]: unknown;
}

function UserProfile({
  user,
  onUpdateProfile,
}: {
  user: ExtendedUser;
  onUpdateProfile: (profile: ProfileUpdate) => void;
}) {
  const [name, setName] = useState(user.displayName || "");
  const [preferences, setPreferences] = useState(user.preferences || {});

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onUpdateProfile({ displayName: name, preferences });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
        <CardDescription>Update your profile and preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Preferences</Label>
            <div className="grid grid-cols-2 gap-2">
              {["Non-smoking", "Quiet room", "High floor", "Low floor"].map(
                (pref) => (
                  <div key={pref} className="flex items-center space-x-2">
                    <Switch
                      id={pref}
                      checked={preferences[pref] as boolean}
                      onCheckedChange={(checked) =>
                        setPreferences({ ...preferences, [pref]: checked })
                      }
                    />
                    <Label htmlFor={pref}>{pref}</Label>
                  </div>
                )
              )}
            </div>
          </div>
          <Button type="submit">Update Profile</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AdminPanel({
  bookings,
  rooms,
  onUpdate,
  onDelete,
  onFetch,
  onImageUpload,
}: {
  bookings: Booking[];
  rooms: Room[];
  onUpdate: (id: string, status: "Pending" | "Confirmed" | "Cancelled") => void;
  onDelete: (id: string) => void;
  onFetch: () => void;
  onImageUpload: (file: File, id: string) => void;
}) {
  useEffect(() => {
    onFetch();
  }, [onFetch]);

  function handleDeleteBooking(id: string, p0: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
        <CardDescription>
          Manage all bookings and rooms across branches.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="rooms">Rooms</TabsTrigger>
          </TabsList>
          <TabsContent value="bookings">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Guests</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>{booking.roomName}</TableCell>
                      <TableCell>{booking.userEmail || "N/A"}</TableCell>
                      <TableCell>
                        {format(new Date(booking.checkIn), "PPP")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.checkOut), "PPP")}
                      </TableCell>
                      <TableCell>{booking.guests}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            booking.status === "Confirmed"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() =>
                                    handleDeleteBooking(booking.id, "Confirmed")
                                  }
                                  size="sm"
                                  variant="outline"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Confirm Booking</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  onClick={() =>
                                    handleDeleteBooking(booking.id, "Confirmed")
                                  }
                                  size="sm"
                                  variant="outline"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancel Booking</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="rooms">
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Room Name</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rooms.map((room) => (
                    <TableRow key={room.id}>
                      <TableCell>{room.name}</TableCell>
                      <TableCell>
                        {typeof room.capacity === "number"
                          ? room.capacity
                          : "Unknown"}
                      </TableCell>
                      <TableCell>${room.price}</TableCell>
                      <TableCell>
                        {room.imageUrl ? (
                          <Image
                            src={room.imageUrl}
                            alt={room.name}
                            width={64}
                            height={64}
                            className="object-cover rounded"
                          />
                        ) : (
                          <span>No image</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <label
                                  htmlFor={`image-upload-${room.id}`}
                                  className="cursor-pointer"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="cursor-pointer"
                                  >
                                    <Upload className="h-4 w-4" />
                                  </Button>
                                </label>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Upload Image</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <input
                            id={`image-upload-${room.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                onImageUpload(file, room.id);
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function LoyaltyProgram({ points }: { points: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loyalty Program</CardTitle>
        <CardDescription>
          Earn points and enjoy exclusive benefits.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Your Points</h3>
            <p className="text-3xl font-bold">{points}</p>
          </div>
          <Progress value={(points % 1000) / 10} className="w-full" />
          <p>{1000 - (points % 1000)} points until your next reward!</p>
          <div>
            <h3 className="text-lg font-semibold">Benefits</h3>
            <ul className="list-disc list-inside">
              <li>Free room upgrade every 5000 points</li>
              <li>Exclusive access to premium amenities</li>
              <li>Priority check-in and late check-out</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewSystem({
  reviews,
  onAddReview,
}: {
  reviews: Review[];
  onAddReview: (roomId: string, rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onAddReview("default-room-id", rating, comment);
    setRating(0);
    setComment("");
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Guest Reviews</CardTitle>
        <CardDescription>
          See what others are saying about their stay.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {typeof review.createdAt === "object" &&
                  "toDate" in review.createdAt
                    ? format(review.createdAt.toDate(), "PPP")
                    : format(new Date(review.createdAt), "PPP")}
                </span>
              </div>
              <p className="mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="rating">Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={rating >= value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRating(value)}
                >
                  <Star
                    className={`h-4 w-4 ${
                      rating >= value ? "text-yellow-400 fill-yellow-400" : ""
                    }`}
                  />
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="mt-1"
            />
          </div>
          <Button type="submit">Submit Review</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ChatSupport({
  messages,
  onSendMessage,
}: {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
}) {
  const [newMessage, setNewMessage] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat Support</CardTitle>
        <CardDescription>
          Get help from our customer support team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] mb-4">
          {messages.map((msg: ChatMessage, index: number) => (
            <div
              key={index}
              className={`mb-2 ${
                msg.userId === "support" ? "text-left" : "text-right"
              }`}
            >
              <div
                className={`inline-block p-2 rounded-lg ${
                  msg.userId === "support"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {msg.message}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {format(new Date(msg.createdAt), "p")}
              </div>
            </div>
          ))}
        </ScrollArea>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
          />
          <Button type="submit">Send</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SpecialOffers({ offers }: { offers: Offer[] }) {
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle>Special Offers</CardTitle>
        <CardDescription>
          Exclusive deals and promotions for our guests.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <CardTitle>{offer.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{offer.description}</p>
                <p className="font-semibold mt-2">
                  Discount: {offer.discount}%
                </p>
              </CardContent>
              <CardFooter>
                <Button>Book Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
function ThreeDModelViewer({
  modelUrl,
  roomNumber,
  maxOccupancy,
}: {
  modelUrl: string;
  roomNumber: number;
  maxOccupancy: number;
}) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer();

      const currentMount = mountRef.current;

      if (currentMount) {
        renderer.setSize(300, 300);
        currentMount.appendChild(renderer.domElement);
      }

      const loader = new GLTFLoader();
      loader.load(
        modelUrl,
        (gltf) => {
          scene.add(gltf.scene);
        },
        undefined,
        (error) => {
          console.error("An error occurred loading the 3D model:", error);
        }
      );

      camera.position.z = 5;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.enableZoom = true;

      // Add room number and occupancy text
      const fontLoader = new FontLoader();
      fontLoader.load(
        "/fonts/helvetiker_regular.typeface.json",
        (font: Font) => {
          const textGeometry = new TextGeometry(
            `Room ${roomNumber}\nMax: ${maxOccupancy}`,
            {
              font: font,
              size: 0.2,
              height: 0.05,
            }
          );
          const textMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
          const textMesh = new THREE.Mesh(textGeometry, textMaterial);
          textMesh.position.set(-1, 2, 0);
          scene.add(textMesh);
        }
      );

      // Add lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      const pointLight = new THREE.PointLight(0xffffff, 1);
      pointLight.position.set(5, 5, 5);
      scene.add(pointLight);

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        if (currentMount) {
          currentMount.removeChild(renderer.domElement);
        }
      };
    }
  }, [modelUrl, roomNumber, maxOccupancy]);

  return <div ref={mountRef} />;
}

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface Floor {
  id: string;
  number: number;
  locationId: string;
  totalRooms: number;
  availableRooms: number;
}

function LocationSelector({
  locations,
  onSelect,
}: {
  locations: Location[];
  onSelect: (locationId: string) => void;
}) {
  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Select Hotel Location</CardTitle>
        <CardDescription>Choose from our available properties</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card
              key={location.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onSelect(location.id)}
            >
              <CardHeader>
                <CardTitle>{location.name}</CardTitle>
                <CardDescription>
                  {location.city}, {location.country}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video relative mb-4">
                  <Image
                    src={location.image}
                    alt={location.name}
                    fill
                    className="object-cover rounded-md"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {location.address}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FloorOverview({
  floors,
  selectedLocationId,
}: {
  floors: Floor[];
  selectedLocationId: string;
}) {
  const locationFloors = floors.filter(
    (floor) => floor.locationId === selectedLocationId
  );

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Floor Overview</CardTitle>
        <CardDescription>Room availability by floor</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {locationFloors.map((floor) => (
            <div
              key={floor.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h4 className="font-semibold">Floor {floor.number}</h4>
                <p className="text-sm text-muted-foreground">
                  {floor.availableRooms} of {floor.totalRooms} rooms available
                </p>
              </div>
              <Progress
                value={(floor.availableRooms / floor.totalRooms) * 100}
                className="w-[200px]"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AddHotelForm() {
  const [hotelData, setHotelData] = useState<{
    name: string;
    locationId: string;
    address: string;
    city: string;
    country: string;
    image: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    floors: any[]; // Replace 'any' with proper type if available
    amenities: string[];
    description: string;
    rating: number;
    priceRange: string;
  }>({
    name: "",
    locationId: "",
    address: "",
    city: "",
    country: "",
    image: "",
    coordinates: { lat: 0, lng: 0 },
    floors: [],
    amenities: [],
    description: "",
    rating: 0,
    priceRange: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(collection(db, "hotels"), {
        ...hotelData,
        createdAt: serverTimestamp(),
      });

      toast.success("Hotel added successfully!");
      setHotelData({
        name: "",
        locationId: "",
        address: "",
        city: "",
        country: "",
        image: "",
        coordinates: { lat: 0, lng: 0 },
        floors: [],
        amenities: [],
        description: "",
        rating: 0,
        priceRange: "",
      });
    } catch (error) {
      console.error("Error adding hotel:", error);
      toast.error("Failed to add hotel");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Hotel</CardTitle>
        <CardDescription>Enter hotel details below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Hotel Name</Label>
              <Input
                id="name"
                value={hotelData.name}
                onChange={(e) =>
                  setHotelData({ ...hotelData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={hotelData.address}
                onChange={(e) =>
                  setHotelData({ ...hotelData, address: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={hotelData.city}
                onChange={(e) =>
                  setHotelData({ ...hotelData, city: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={hotelData.country}
                onChange={(e) =>
                  setHotelData({ ...hotelData, country: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={hotelData.image}
                onChange={(e) =>
                  setHotelData({ ...hotelData, image: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priceRange">Price Range</Label>
              <Select
                onValueChange={(value) =>
                  setHotelData({ ...hotelData, priceRange: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={hotelData.description}
              onChange={(e) =>
                setHotelData({ ...hotelData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {["WiFi", "Pool", "Spa", "Gym", "Restaurant", "Parking"].map(
                (amenity) => (
                  <Button
                    key={amenity}
                    type="button"
                    variant={
                      hotelData.amenities.includes(amenity)
                        ? "default"
                        : "outline"
                    }
                    onClick={() => {
                      setHotelData({
                        ...hotelData,
                        amenities: hotelData.amenities.includes(amenity)
                          ? hotelData.amenities.filter((a) => a !== amenity)
                          : [...hotelData.amenities, amenity],
                      });
                    }}
                  >
                    {amenity}
                  </Button>
                )
              )}
            </div>
          </div>

          <Button type="submit" className="w-full">
            Add Hotel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function searchHotels(city: string, branch?: string) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markers: google.maps.Marker[] = [];
  const MARKER_PATH =
    "https://developers.google.com/maps/documentation/javascript/images/marker_green";

  const clearResults = () => {
    const results = document.getElementById("results") as HTMLElement;
    while (results?.childNodes[0]) {
      results.removeChild(results.childNodes[0]);
    }
  };

  const clearMarkers = () => {
    for (let i = 0; i < markers.length; i++) {
      if (markers[i]) {
        markers[i].setMap(null);
      }
    }
    markers.length = 0;
  };

  const addResult = (result: google.maps.places.PlaceResult, i: number) => {
    const results = document.getElementById("results") as HTMLElement;
    const markerLetter = String.fromCharCode("A".charCodeAt(0) + (i % 26));
    const markerIcon = MARKER_PATH + markerLetter + ".png";

    const tr = document.createElement("tr");
    tr.style.backgroundColor = i % 2 === 0 ? "#F0F0F0" : "#FFFFFF";
    tr.onclick = () => {
      google.maps.event.trigger(markers[i], "click");
    };

    const iconTd = document.createElement("td");
    const nameTd = document.createElement("td");
    const icon = document.createElement("img");
    icon.src = markerIcon;
    icon.setAttribute("class", "placeIcon");
    icon.setAttribute("className", "placeIcon");

    const name = document.createTextNode(result.name || "");
    iconTd.appendChild(icon);
    nameTd.appendChild(name);
    tr.appendChild(iconTd);
    tr.appendChild(nameTd);
    results.appendChild(tr);
  };

  const dropMarker = (i: number) => {
    return () => {
      if (markers[i] && mapRef.current) {
        markers[i].setMap(mapRef.current);
      }
    };
  };

  const searchRequest = {
    bounds: mapRef.current?.getBounds() as google.maps.LatLngBounds,
    types: ["lodging"],
    query: `${branch || ""} hotels in ${city}`,
  };

  if (mapRef.current) {
    const service = new google.maps.places.PlacesService(mapRef.current);
    service.nearbySearch(searchRequest, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        clearResults();
        clearMarkers();

        // Create a marker for each hotel found
        for (let i = 0; i < results.length; i++) {
          const markerLetter = String.fromCharCode(
            "A".charCodeAt(0) + (i % 26)
          );
          const markerIcon = MARKER_PATH + markerLetter + ".png";

          // Use marker animation to drop the icons incrementally on the map
          markers[i] = new google.maps.Marker({
            position: results[i].geometry?.location,
            animation: google.maps.Animation.DROP,
            icon: markerIcon,
          });

          // If the user clicks a hotel marker, show the details of that hotel
          (markers[i] as any).placeResult = results[i];
          google.maps.event.addListener(markers[i], "click", showInfoWindow);
          setTimeout(dropMarker(i), i * 100);
          addResult(results[i], i);
        }
      }
    });
  }
}
function showInfoWindow(...args: any[]): void {
  throw new Error("Function not implemented.");
}
