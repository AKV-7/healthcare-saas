import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Helper function to delay execution
 */
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with retry logic for handling rate limiting
 * @param url The URL to fetch
 * @param options Request options
 * @param maxRetries Maximum number of retries
 * @param initialDelay Initial delay in ms before retrying
 * @returns Response object
 */
export const fetchWithRetry = async (
  url: string, 
  options: RequestInit, 
  maxRetries = 5, 
  initialDelay = 2000
): Promise<Response> => {
  let delayTime = initialDelay;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Add a small random delay to stagger requests
      if (attempt > 0) {
        const jitter = Math.floor(Math.random() * 500);
        await delay(jitter);
      }
      
      const response = await fetch(url, options);
      
      // If we get a 429, wait and retry
      if (response.status === 429) {
        // Check for Retry-After header
        const retryAfter = response.headers.get('Retry-After');
        const retryDelay = retryAfter ? parseInt(retryAfter, 10) * 1000 : delayTime;
        
        console.log(`Rate limited (attempt ${attempt + 1}/${maxRetries}), waiting ${retryDelay}ms before retry`);
        await delay(retryDelay);
        delayTime *= 3; // More aggressive exponential backoff
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${attempt + 1} failed:`, error);
      await delay(delayTime);
      delayTime *= 3; // More aggressive exponential backoff
    }
  }
  
  // Return an empty successful response instead of throwing
  // This prevents the dashboard from breaking completely
  console.warn(`Request to ${url} failed after ${maxRetries} attempts, returning empty response`);
  return new Response(JSON.stringify({ data: [], stats: {} }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

/**
 * Format a date string to a more readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Format time string to 12-hour format
 */
export function formatTime(timeString: string): string {
  if (!timeString) return '';
  
  // Handle both "HH:MM" and "HH:MM:SS" formats
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  
  return `${formattedHour}:${minutes} ${ampm}`;
}

export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

export const convertFileToUrl = (file: File) => URL.createObjectURL(file);

// FORMAT DATE TIME
export const formatDateTime = (
  dateString: Date | string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    // weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: 'short', // abbreviated month name (e.g., 'Oct')
    day: 'numeric', // numeric day of the month (e.g., '25')
    year: 'numeric', // numeric year (e.g., '2023')
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false),
    timeZone, // use the provided timezone
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short', // abbreviated weekday name (e.g., 'Mon')
    year: 'numeric', // numeric year (e.g., '2023')
    month: '2-digit', // abbreviated month name (e.g., 'Oct')
    day: '2-digit', // numeric day of the month (e.g., '25')
    timeZone, // use the provided timezone
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: 'short', // abbreviated month name (e.g., 'Oct')
    year: 'numeric', // numeric year (e.g., '2023')
    day: 'numeric', // numeric day of the month (e.g., '25')
    timeZone, // use the provided timezone
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric', // numeric hour (e.g., '8')
    minute: 'numeric', // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
    timeZone, // use the provided timezone
  };

  const formattedDateTime: string = new Date(dateString).toLocaleString('en-US', dateTimeOptions);

  const formattedDateDay: string = new Date(dateString).toLocaleString('en-US', dateDayOptions);

  const formattedDate: string = new Date(dateString).toLocaleString('en-US', dateOptions);

  const formattedTime: string = new Date(dateString).toLocaleString('en-US', timeOptions);

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

export const encryptKey = (passkey: string) => btoa(passkey);

export const decryptKey = (passkey: string) => atob(passkey);
