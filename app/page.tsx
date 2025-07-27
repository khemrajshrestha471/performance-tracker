import {
  ArrowRight,
  BarChart3,
  Users,
  Target,
  FileText,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  const features = [
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Advanced Analytics",
      description:
        "Real-time dashboards with comprehensive performance metrics.",
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Team Management",
      description:
        "Centralized employee profiles and organizational structure.",
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Goal Tracking",
      description: "OKR framework with progress visualization.",
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Review Cycles",
      description: "Automated 360° feedback and performance reviews.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "HR Director, Nvidia",
      content:
        "Reduced our review cycle time by 60% while improving feedback quality.",
      avatar: "/profile2.jpg",
    },
    {
      name: "Michael Chen",
      role: "VP Operations, Leapfrog",
      content:
        "The analytics helped us identify top performers and skill gaps we were missing.",
      avatar: "/profile1.jpg",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <header className="sticky top-0">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">PerfTrack</span>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/10">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                <span className="block">Modern Performance</span>
                <span className="block text-primary mt-2">
                  Management System
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Transform how you measure, analyze, and improve employee
                performance with our AI-powered platform.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button asChild size="lg">
                  <Link href="/demo">
                    Request Demo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#solutions">Explore Solutions</Link>
                </Button>
              </div>
            </div>
            <div className="relative aspect-video rounded-xl overflow-hidden shadow-xl">
              <Image
                src="/landing_preview.png"
                alt="Dashboard Preview"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </section>

        {/* Clients Section */}
        <section className="py-12 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-sm text-muted-foreground text-center">
              TRUSTED BY INDUSTRY LEADERS
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center">
              {["tata", "fuse", "leapfrog", "nvidia", "microsoft"].map(
                (logo) => (
                  <div
                    key={logo}
                    className="relative h-20 w-32 grayscale opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <Image
                      src={`/${logo}.png`}
                      alt={`${logo} logo`}
                      fill
                      className="object-contain"
                    />
                  </div>
                )
              )}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Enterprise-Grade Features
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Designed for HR teams and people managers who need actionable
                insights.
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, index) => (
                <Card
                  key={index}
                  className="p-6 hover:shadow-lg transition-all duration-300"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="p-3 rounded-full bg-primary/10 text-primary mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Solutions Section */}
        <section id="solutions" className="py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-xl">
                <Image
                  src="/customized.png"
                  alt="Analytics Dashboard"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Tailored Solutions for Your Needs
                </h2>
                <div className="mt-8 space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold">For HR Teams</h3>
                    <p className="mt-2 text-muted-foreground">
                      Streamline your entire performance management cycle with
                      automated workflows and centralized reporting.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      For People Managers
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      Get real-time insights into team performance with
                      intuitive dashboards and coaching recommendations.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">For Executives</h3>
                    <p className="mt-2 text-muted-foreground">
                      Organization-wide visibility into talent metrics that
                      drive strategic decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                What Our Clients Say
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    "{testimonial.content}"
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  About PerfTrack
                </h2>
                <p className="mt-6 text-muted-foreground">
                  Founded in 2020, PerfTrack was born out of a need for modern,
                  intuitive performance management tools that actually get used.
                  Our platform combines behavioral science with cutting-edge
                  technology to deliver meaningful insights.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">100+</h3>
                    <p className="text-muted-foreground">Enterprise Clients</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">4.9/5</h3>
                    <p className="text-muted-foreground">
                      Customer Satisfaction
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden shadow-xl">
                <Image
                  src="/team.png"
                  alt="Our Team"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Get In Touch
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                Have questions? Our team is here to help.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary mt-1">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Email Us</h3>
                    <p className="text-muted-foreground">
                      contact@perftrack.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary mt-1">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Call Us</h3>
                    <p className="text-muted-foreground">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10 text-primary mt-1">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Visit Us</h3>
                    <p className="text-muted-foreground">
                      123 Business Ave, San Francisco, CA 94107
                    </p>
                  </div>
                </div>
              </div>
              <Card className="p-8">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="first-name"
                        className="block text-sm font-medium mb-1"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        id="first-name"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="last-name"
                        className="block text-sm font-medium mb-1"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="last-name"
                        className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-medium mb-1"
                    >
                      Message
                    </label>
                    <textarea
                      id="message"
                      rows={4}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                    ></textarea>
                  </div>
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              Ready to Transform Your Organization?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Join thousands of companies revolutionizing their performance
              management.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild variant="secondary" size="lg">
                <Link href="/demo">Request Demo</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-primary-foreground border-primary-foreground hover:bg-primary-foreground/10"
              >
                <Link href="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-background border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/features"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/integrations"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Changelog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/press"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Press
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/help"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link
                    href="/guides"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Guides
                  </Link>
                </li>
                <li>
                  <Link
                    href="/webinars"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Webinars
                  </Link>
                </li>
                <li>
                  <Link
                    href="/status"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Status
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Privacy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Terms
                  </Link>
                </li>
                <li>
                  <Link
                    href="/security"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cookies"
                    className="text-sm text-muted-foreground hover:text-primary"
                  >
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-muted flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="font-medium">PerfTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PerfTrack, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
