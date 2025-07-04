'use client';

import Image from "next/image";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";

import { SimpleNavButton } from "@/components/SimpleNavButton";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomeClient() {
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [videoStates, setVideoStates] = useState<{ [key: number]: { isPlaying: boolean; isMuted: boolean } }>({});
  const [mounted, setMounted] = useState(false);

  const testimonials = [
    {
      video: "https://res.cloudinary.com/dgvs3l5yo/video/upload/v1751455326/healthcare/videos/healthcare/videos/uncle.mp4",
      text: "The doctors are so caring and knowledgeable. Highly recommend!"
    },
    {
      video: "https://res.cloudinary.com/dgvs3l5yo/video/upload/v1751455315/healthcare/videos/healthcare/videos/girl.mp4",
      text: "I found relief after years of suffering. Thank you Khushi Homoeo!"
    },
    {
      video: "https://res.cloudinary.com/dgvs3l5yo/video/upload/v1751455321/healthcare/videos/healthcare/videos/kid.mp4",
      text: "My child&apos;s health improved so much. Thank you!"
    },
    {
      video: "https://res.cloudinary.com/dgvs3l5yo/video/upload/v1751455310/healthcare/videos/healthcare/videos/black_shirt.mp4",
      text: "Booking was easy and the treatment worked wonders."
    },
    {
      video: "https://res.cloudinary.com/dgvs3l5yo/video/upload/v1751455324/healthcare/videos/healthcare/videos/orange.mp4",
      text: "Amazing results with homoeopathic treatment. Highly satisfied!"
    }
  ];

  const scrollTo = (direction: 'left' | 'right') => {
    if (testimonialsRef.current) {
      const container = testimonialsRef.current;
      const scrollAmount = 340; // Width of one video card plus gap
      
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    // Add scroll-smooth to html element
    document.documentElement.classList.add('scroll-smooth');
    return () => {
      document.documentElement.classList.remove('scroll-smooth');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
        <div className="flex min-h-screen items-center justify-center">
          <div className="size-32 animate-spin rounded-full border-b-2 border-rose-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">      
      {/* Navigation */}
      <header className="relative z-50">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex lg:flex-1">
            <Link href="/" className="-m-1.5 p-1.5">
              <Image
                src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                alt="Khushi Homoeopathic Clinic"
                width={150}
                height={45}
                className="h-10 w-auto"
              />
            </Link>
          </div>
          <div className="hidden lg:flex lg:gap-x-8">
            <Link href="#hero" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Home
            </Link>
            <Link href="#doctors" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Doctors
            </Link>
            <Link href="#treatments" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Treatments
            </Link>
            <Link href="#testimonials" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Testimonials
            </Link>
            <Link href="#contact" className="text-sm font-semibold leading-6 text-gray-900 hover:text-rose-600 dark:text-white dark:hover:text-rose-400">
              Contact
            </Link>
          </div>
          <div className="flex items-center gap-4 lg:flex-1 lg:justify-end">
            <Link href="/existing-patient" className="text-sm font-semibold leading-6 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300">
              Existing Patient
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-0 top-0 size-96 animate-blob rounded-full bg-gradient-to-br from-rose-200/30 to-amber-200/30 blur-3xl dark:from-rose-800/30 dark:to-amber-800/30"></div>
          <div className="animation-delay-2000 absolute bottom-0 right-0 size-96 animate-blob rounded-full bg-gradient-to-tl from-amber-200/30 to-rose-200/30 blur-3xl dark:from-amber-800/30 dark:to-rose-800/30"></div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-32 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="mb-6">
                <h3 className="text-3xl font-bold text-rose-600 dark:text-rose-400 md:text-4xl lg:text-5xl">
                  Khushi Homoeopathic Clinic
                </h3>
                <div className="mt-2 flex items-center justify-center gap-1 lg:justify-start">
                  <div className="h-1 w-12 rounded-full bg-gradient-to-r from-rose-500 to-amber-500"></div>
                  <div className="h-1 w-8 rounded-full bg-gradient-to-r from-amber-500 to-rose-500"></div>
                  <div className="h-1 w-4 rounded-full bg-gradient-to-r from-rose-500 to-amber-500"></div>
                </div>
              </div>
              <h1 className="font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
                <span className="bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300">
                  Help for Helpless
                </span>
                <br />
                <span className="text-gray-700 dark:text-gray-200">Hope for Hopeless</span>
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 md:text-xl lg:text-2xl">
                Experience the power of homeopathy with our expert doctors. 
                Safe, natural, and effective treatments for lasting wellness.
              </p>
              
              {/* Statistics */}
              <div className="grid grid-cols-1 gap-6 py-6 md:grid-cols-3">
                <div className="text-center">
                  <div className="mb-2 text-2xl font-bold text-rose-600 dark:text-rose-400 md:text-3xl">10+</div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-2xl font-bold text-amber-600 dark:text-amber-400 md:text-3xl">10K+</div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Patients Treated</div>
                </div>
                <div className="text-center">
                  <div className="mb-2 text-2xl font-bold text-rose-600 dark:text-rose-400 md:text-3xl">50+</div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-300">Conditions Treated</div>
                </div>
              </div>
              
              {/* Features */}
              <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-r from-green-500 to-emerald-500 p-2">
                    <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">100% Natural</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 p-2">
                    <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">No Side Effects</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-2">
                    <svg className="size-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Expert Care</span>
                </div>
              </div>
              <div className="flex flex-col justify-center gap-4 sm:flex-row lg:justify-start">
                <a
                  href="/register"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-rose-600 to-amber-600 px-8 py-4 text-lg font-semibold text-white no-underline shadow-lg transition-all duration-200 hover:-translate-y-1 hover:from-rose-700 hover:to-amber-700 hover:shadow-xl"
                  style={{ textDecoration: 'none' }}
                >
                  Book Appointment
                </a>
                <a
                  href="/existing-patient"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 no-underline transition-all duration-200 hover:-translate-y-1 hover:border-rose-600 hover:text-rose-600 dark:border-gray-600 dark:text-gray-200 dark:hover:border-rose-400 dark:hover:text-rose-400"
                  style={{ textDecoration: 'none' }}
                >
                  Existing Patient
                </a>
                <a
                  href="/appointment-status"
                  className="inline-flex cursor-pointer items-center justify-center rounded-full border-2 border-amber-300 px-8 py-4 text-lg font-semibold text-amber-700 no-underline transition-all duration-200 hover:-translate-y-1 hover:border-amber-600 hover:text-amber-600 dark:border-amber-600 dark:text-amber-200 dark:hover:border-amber-400 dark:hover:text-amber-400"
                  style={{ textDecoration: 'none' }}
                >
                  Appointment Status
                </a>
              </div>
            </div>

            {/* Right Image */}
            <div className="group relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-rose-500/20 to-amber-500/20 opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-75 dark:from-rose-500/30 dark:to-amber-500/30"></div>
              <div className="relative h-[600px] overflow-hidden rounded-3xl shadow-2xl transition-transform duration-500 group-hover:-rotate-1 group-hover:scale-[1.02]">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455211/healthcare/images/healthcare/images/clinic1.jpg"
                  alt="Khushi Homoeopathic Clinic"
                  width={800}
                  height={600}
                  className="size-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-amber-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctors Section */}
      <section id="doctors" className="bg-gradient-to-br from-amber-50 via-white to-rose-50 py-24 dark:from-gray-800 dark:via-gray-900 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="bg-gradient-to-r from-gray-900 via-amber-800 to-rose-800 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:via-amber-300 dark:to-rose-300 sm:text-4xl">
              Know Your Doctors
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Meet our compassionate team of certified homeopathic practitioners who combine traditional wisdom with modern care to deliver exceptional healing experiences tailored just for you.
            </p>
          </div>
          <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-2">
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-rose-500/20 to-amber-500/20 opacity-50 blur-sm transition-opacity duration-500 group-hover:opacity-75"></div>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-white to-rose-50 shadow-lg dark:from-gray-800 dark:to-gray-700">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455214/healthcare/images/healthcare/images/doctor1.jpg"
                  alt="Dr. M. K. Singh"
                  width={300}
                  height={300}
                  className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold leading-8 text-gray-900 dark:text-white">
                  Dr. M. K. Singh
                </h3>
                <p className="text-sm font-medium leading-6 text-rose-600 dark:text-rose-400">
                  B.H.M.S. S.C.P.H+ (Mumbai)
                </p>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Classical Homeopath
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-500">
                  Reg. No. H036488
                </p>
              </div>
            </div>
            
            <div className="group relative">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 opacity-50 blur-sm transition-opacity duration-500 group-hover:opacity-75"></div>
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-white to-amber-50 shadow-lg dark:from-gray-800 dark:to-gray-700">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455216/healthcare/images/healthcare/images/doctor2.jpg"
                  alt="Dr. Rajni Singh"
                  width={300}
                  height={300}
                  className="size-full object-cover object-center transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="mt-6">
                <h3 className="text-lg font-semibold leading-8 text-gray-900 dark:text-white">
                  Dr. Rajni Singh
                </h3>
                <p className="text-sm font-medium leading-6 text-rose-600 dark:text-rose-400">
                  B.H.M.S., S.C.P.H (Mumbai)
                </p>
                <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Classical Homoeopath
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-500">
                  Reg. No. H038658
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Treatments Section */}
      <section id="treatments" className="bg-gradient-to-br from-amber-50 via-rose-50 to-amber-50 py-24 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="bg-gradient-to-r from-gray-900 via-amber-800 to-rose-800 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:via-amber-300 dark:to-rose-300 sm:text-4xl">
              Conditions We Treat
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Our comprehensive homeopathic treatments cover a wide range of health conditions with natural, safe solutions.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Skin Diseases */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-rose-50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:from-rose-50 hover:to-amber-50 hover:shadow-xl dark:from-gray-900 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-700">
              <div className="flex aspect-[3/2] items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455243/healthcare/images/healthcare/images/skin.jpg"
                  alt="Skin Diseases"
                  width={600}
                  height={400}
                  className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Skin Diseases</h3>
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Eczema (एक्जिमा)</li>
                  <li>• White patches (सफेद दाग)</li>
                  <li>• Urticaria (पित्ती)</li>
                  <li>• Psoriasis (सोराइसिस)</li>
                  <li>• Ringworm (दाद)</li>
                </ul>
              </div>
            </div>

            {/* Joint Pain */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-amber-50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:from-amber-50 hover:to-rose-50 hover:shadow-xl dark:from-gray-900 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-700">
              <div className="flex aspect-[3/2] items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455209/healthcare/images/healthcare/images/back.jpg"
                  alt="Joint Pain"
                  width={600}
                  height={400}
                  className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Joint Pain</h3>
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Back pain (कमर दर्द)</li>
                  <li>• Slipped disc (स्लिप डिस्क)</li>
                  <li>• Cervical spondylitis (सर्वाइकल स्पॉन्डिलाइटिस)</li>
                  <li>• Arthritis (गठिया)</li>
                  <li>• Rheumatoid arthritis (रूमेटाइड आर्थराइटिस)</li>
                </ul>
              </div>
            </div>

            {/* Pediatric Diseases */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-rose-50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:from-rose-50 hover:to-amber-50 hover:shadow-xl dark:from-gray-900 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-700">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Pediatric Diseases</h3>
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Pneumonia (निमोनिया)</li>
                  <li>• Allergy (एलर्जी)</li>
                  <li>• Asthma (अस्थमा)</li>
                  <li>• Abdominal pain (पेट दर्द)</li>
                  <li>• Weak immunity (कमजोर प्रतिरक्षा)</li>
                  <li>• Tonsillitis (टॉन्सिल)</li>
                </ul>
              </div>
            </div>

            {/* Gynecological Issues */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-amber-50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:from-amber-50 hover:to-rose-50 hover:shadow-xl dark:from-gray-900 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-700">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Gynecological Issues</h3>
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Leucorrhea (ल्यूकोरिया)</li>
                  <li>• Menstrual problems (मासिक धर्म समस्याएं)</li>
                  <li>• Uterine fibroids (बच्चेदानी की गांठ)</li>
                  <li>• Thyroid (थायराइड)</li>
                  <li>• Infertility (बांझपन)</li>
                </ul>
              </div>
            </div>

            {/* Mental Health */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-amber-50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:from-amber-50 hover:to-rose-50 hover:shadow-xl dark:from-gray-900 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-700">
              <div className="flex aspect-[3/2] items-center justify-center overflow-hidden bg-gray-100 dark:bg-gray-700">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455225/healthcare/images/healthcare/images/mood.jpg"
                  alt="Mental Health"
                  width={600}
                  height={400}
                  className="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Mental Health</h3>
                <ul className="mt-3 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Depression (डिप्रेशन)</li>
                  <li>• OCD (बार-बार हाथ धोना)</li>
                  <li>• Insomnia (नींद न आना)</li>
                  <li>• Irritability (चिड़चिड़ापन)</li>
                  <li>• Schizophrenia (स्किज़ोफ्रेनिया)</li>
                </ul>
              </div>
            </div>

            {/* Other Conditions */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-white to-rose-50 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:from-rose-50 hover:to-amber-50 hover:shadow-xl dark:from-gray-900 dark:to-gray-800 dark:hover:from-gray-800 dark:hover:to-gray-700">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Other Conditions</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-300 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div>• Hypertension (ब्लड प्रेशर)</div>
                    <div>• Diabetes (मधुमेह)</div>
                    <div>• Paralysis (लकवा)</div>
                    <div>• Jaundice (पीलिया)</div>
                    <div>• Digestive issues (पाचन समस्याएं)</div>
                    <div>• Ulcers (अल्सर)</div>
                    <div>• Indigestion (अपच)</div>
                    <div>• Vomiting (उल्टी)</div>
                    <div>• Obesity (मोटापा)</div>
                  </div>
                  <div className="space-y-1">
                    <div>• Hemorrhoids (बवासीर)</div>
                    <div>• Fistula (भगन्दर)</div>
                    <div>• Kidney stones (गुर्दे की पथरी)</div>
                    <div>• Birth defects (जन्मजात दोष)</div>
                    <div>• Cerebral palsy (सेरेब्रल पाल्सी)</div>
                    <div>• Autism (ऑटिज्म)</div>
                    <div>• Cancer (कैंसर)</div>
                    <div>• Sexual problems (सेक्स संबंधी समस्याएं)</div>
                    <div>• Hair loss (बालों का झड़ना)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="bg-gradient-to-br from-rose-50 via-white to-amber-50 py-24 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300 sm:text-4xl">
              What Our Patients Say
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Real stories from patients who found healing through our homeopathic treatments.
            </p>
          </div>
          
          <div className="relative mt-16">
            {/* Left Navigation Button */}
            <button
              onClick={() => scrollTo('left')}
              className="absolute left-0 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:from-rose-600 hover:to-amber-600 hover:shadow-xl"
            >
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Right Navigation Button */}
            <button
              onClick={() => scrollTo('right')}
              className="absolute right-0 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:from-rose-600 hover:to-amber-600 hover:shadow-xl"
            >
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            {/* Videos Container */}
            <div 
              ref={testimonialsRef}
              className="remove-scrollbar flex gap-6 overflow-x-auto px-16 pb-4"
            >
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="w-80 shrink-0"
                >
                  <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-rose-50 to-amber-50 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-gray-700 dark:to-gray-800">
                    {/* Video Container */}
                    <div className="relative h-[568px] w-80 overflow-hidden bg-black">
                      <video
                        ref={(el) => {
                          if (el) {
                            el.addEventListener('loadedmetadata', () => {
                              el.playbackRate = 1.0;
                            });
                          }
                        }}
                        id={`testimonial-video-${index}`}
                        src={testimonial.video}
                        className="size-full object-cover"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        onPlay={() => {
                          setVideoStates(prev => ({
                            ...prev,
                            [index]: { ...prev[index], isPlaying: true }
                          }));
                        }}
                        onPause={() => {
                          setVideoStates(prev => ({
                            ...prev,
                            [index]: { ...prev[index], isPlaying: false }
                          }));
                        }}
                      />
                      
                      {/* Play/Pause Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => {
                            const video = document.getElementById(`testimonial-video-${index}`) as HTMLVideoElement;
                            if (video) {
                              if (video.paused) {
                                video.playbackRate = 1.0;
                                video.play().catch(console.error);
                              } else {
                                video.pause();
                              }
                            }
                          }}
                          className="flex size-16 items-center justify-center rounded-full bg-white/90 text-gray-900 shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-white"
                        >
                          {videoStates[index]?.isPlaying ? (
                            <svg className="size-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                            </svg>
                          ) : (
                            <svg className="ml-1 size-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          )}
                        </button>
                      </div>
                      
                      {/* Mute/Unmute Button */}
                      <button
                        onClick={() => {
                          const video = document.getElementById(`testimonial-video-${index}`) as HTMLVideoElement;
                          if (video) {
                            video.muted = !video.muted;
                            setVideoStates(prev => ({
                              ...prev,
                              [index]: { ...prev[index], isMuted: video.muted }
                            }));
                          }
                        }}
                        className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:scale-110 hover:bg-black/90"
                      >
                        {videoStates[index]?.isMuted !== false ? (
                          <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3.63 3.63a.996.996 0 000 1.41L7.29 8.7 7 9H4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71v-4.17l4.18 4.18c-.49.37-1.02.68-1.6.91-.36.15-.58.53-.58.92 0 .72.73 1.18 1.39.91.8-.33 1.55-.77 2.22-1.31l4.18 4.18a.996.996 0 101.41-1.41L5.05 3.63c-.39-.39-1.02-.39-1.42 0zM19 12c0 .82-.15 1.61-.41 2.34l1.53 1.53c.56-1.17.88-2.48.88-3.87 0-3.83-2.4-7.11-5.78-8.4-.59-.23-1.22.23-1.22.86v.19c0 .38.25.71.61.85C17.18 6.54 19 9.06 19 12zm-8.71-6.29l-.17.17L12 7.76V6.41c0-.89-1.08-1.34-1.71-.71zM16.5 12c0-1.77-1.02-3.29-2.5-4.03v1.79l2.48 2.48c.01-.08.02-.16.02-.24z"/>
                          </svg>
                        ) : (
                          <svg className="size-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M3 10v4c0 .55.45 1 1 1h3l3.29 3.29c.63.63 1.71.18 1.71-.71V6.41c0-.89-1.08-1.34-1.71-.71L7 9H4c-.55 0-1 .45-1 1zm13.5 2c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Text Content */}
                    <div className="p-6">
                      <p className="text-center text-gray-700 dark:text-gray-200">{testimonial.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-gradient-to-br from-rose-50 via-amber-50 to-rose-50 py-24 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="bg-gradient-to-r from-gray-900 via-rose-800 to-amber-800 bg-clip-text text-3xl font-bold tracking-tight text-transparent dark:from-white dark:via-rose-300 dark:to-amber-300 sm:text-4xl">
              Get in Touch
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Ready to start your journey to better health? Contact us today to book your consultation.
            </p>
          </div>
          
          <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Contact Information */}
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Clinic Information</h3>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg className="size-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Address</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        Side Gate Yuvraj Residence<br />
                        Near Sale Tax Office Stadium Road<br />
                        Ram Ganga Vihar, Moradabad
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg className="size-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Phone</p>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <p>+91 9756077474</p>
                        <p>+91 7017819734</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg className="size-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Email</p>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">info@khushihomoeo.com</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="shrink-0">
                      <svg className="size-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Hours</p>
                      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <p>10:30 AM - 1:30 PM</p>
                        <p>5:00 PM - 8:30 PM</p>
                        <p>Sunday: Closed</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Google Maps */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Find Us on Map</h3>
              <div className="overflow-hidden rounded-lg shadow-lg">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3493.9250268708984!2d78.74934957536752!3d28.870847975535355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390af94bf2dcef1f%3A0x2f0e7aecf9b4b57f!2sKhushi%20Homeopathic%20Clinic!5e0!3m2!1sen!2sin!4v1751571023906!5m2!1sen!2sin" 
                  width="100%" 
                  height="400" 
                  style={{border: 0}} 
                  allowFullScreen={true}
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-rose-900/10 via-transparent to-amber-900/10"></div>
        <div className="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Link href="/" className="block">
                <Image
                  src="https://res.cloudinary.com/dgvs3l5yo/image/upload/v1751455263/healthcare/icons/healthcare/icons/khushi-homoeo-logo.svg"
                  alt="Khushi Homoeopathic Clinic"
                  width={200}
                  height={60}
                  className="h-12 w-auto"
                />
              </Link>
              <p className="mt-4 max-w-md text-gray-300">
                Providing natural and effective homeopathic treatments for over 15 years. 
                Your health is our priority, and we&apos;re committed to helping you achieve lasting wellness.
              </p>
            </div>
            
            <div>
              <h4 className="mb-4 text-lg font-semibold">Quick Links</h4>
              <ul className="space-y-2">
                <li>
                  <SimpleNavButton 
                    href="#hero" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                    isAnchor={true}
                  >
                    Home
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="#doctors" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                    isAnchor={true}
                  >
                    Doctors
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="#treatments" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                    isAnchor={true}
                  >
                    Treatments
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="#testimonials" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                    isAnchor={true}
                  >
                    Testimonials
                  </SimpleNavButton>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="mb-4 text-lg font-semibold">Services</h4>
              <ul className="space-y-2">
                <li>
                  <SimpleNavButton 
                    href="/register" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Register Patient
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="/existing-patient" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Patient Login
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="/appointment-status" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                  >
                    Appointment Status
                  </SimpleNavButton>
                </li>
                <li>
                  <SimpleNavButton 
                    href="#contact" 
                    className="block text-gray-300 transition-colors hover:text-white focus:text-white focus:outline-none"
                    isAnchor={true}
                  >
                    Contact Us
                  </SimpleNavButton>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 flex flex-col items-center justify-between border-t border-gray-800 pt-8 sm:flex-row">
            <p className="text-gray-400">
              © 2024 Khushi Homoeopathic Clinic. All rights reserved.
            </p>
            <SimpleNavButton
              href="/admin"
              className="mt-4 inline-flex items-center rounded-md border border-gray-700 px-4 py-2 text-xs font-medium text-gray-400 transition-colors hover:border-gray-600 hover:text-white sm:mt-0"
            >
              <svg className="mr-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Admin Access
            </SimpleNavButton>
          </div>
        </div>
      </footer>
    </div>
  );
}
