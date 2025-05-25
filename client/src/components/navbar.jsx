"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.jsx"
import { Menu, X, User, LogOut, Ticket, Calendar, Users, Settings, LayoutDashboard, Wallet } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const Navbar = () => {
  const { user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
      <header className="w-screen fixed top-0 bg-background border-b z-50">
        <div className="ml-10 mr-10 w-auto">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="font-mono font-bold text-xl text-foreground">
              EventTicket
            </Link>

            {/* Desktop Navigation */}
            <NavigationMenu className="hidden md:flex flex-grow justify-center">
              <NavigationMenuList className="flex items-center space-x-1">
                {/* Attendee Navigation */}
                {user?.role === "attendee" && (
                    <>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/browse-events"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Browse Events
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/my-tickets"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            My Tickets
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/find-organizers"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Find Organizers
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/wallet"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            <Wallet className="h-4 w-4 mr-2" />
                            Wallet
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    </>
                )}

                {/* Organizer Navigation */}
                {user?.role === "organizer" && (
                    <>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/my-events"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            My Events
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/create-event"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Create Event
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/followers"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Followers
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/analytics"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Analytics
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    </>
                )}

                {/* Admin Navigation */}
                {user?.role === "admin" && (
                    <>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/dashboard"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Dashboard
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/events"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Manage Events
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/venues"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Manage Venues
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                      <NavigationMenuItem>
                        <NavigationMenuLink asChild>
                          <Link
                              to="/users"
                              className={cn(
                                  "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              )}
                          >
                            Manage Users
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    </>
                )}

                {/* Guest Navigation */}
                {!user && (
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link
                            to="/browse-events"
                            className={cn(
                                "group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                            )}
                        >
                          Browse Events
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Right Side - User Menu */}
            <div className="flex items-center space-x-2">
              {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                          variant="ghost"
                          className="h-12 w-12 rounded-full hover:bg-accent"
                          aria-label="Toggle user menu"
                      >
                        <User size={32} className="min-w-8" />
                        <span className="sr-only">Toggle user menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {user.role === "organizer" && (
                        <DropdownMenuItem>
                          <Button asChild variant="ghost">
                            <Link to="/profile" className="w-full flex items-center">
                              <User className="mr-2 h-4 w-4" />
                              Profile
                            </Link>
                          </Button>
                        </DropdownMenuItem>
                      )}
                      {user.role === "attendee" && (
                          <>
                            <DropdownMenuItem>
                              <Button asChild variant="ghost">
                                <Link to="/my-tickets" className="w-full flex items-center">
                                  <Ticket className="mr-2 h-4 w-4" />
                                  My Tickets
                                </Link>
                              </Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Button asChild variant="ghost">
                                <Link to="/wallet" className="w-full flex items-center">
                                  <Wallet className="mr-2 h-4 w-4" />
                                  Wallet
                                </Link>
                              </Button>
                            </DropdownMenuItem>
                          </>
                      )}
                      {user.role === "organizer" && (
                          <>
                            <DropdownMenuItem>
                              <Button asChild variant="ghost">
                                <Link to="/my-events" className="w-full flex items-center">
                                  <Calendar className="mr-2 h-4 w-4" />
                                  My Events
                                </Link>
                              </Button>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Button asChild variant="ghost">
                                <Link to="/followers" className="w-full flex items-center">
                                  <Users className="mr-2 h-4 w-4" />
                                  Followers
                                </Link>
                              </Button>
                            </DropdownMenuItem>
                          </>
                      )}
                      {user.role === "admin" && (
                          <DropdownMenuItem>
                            <Button asChild variant="ghost">
                              <Link to="/dashboard" className="w-full flex items-center">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Admin Dashboard
                              </Link>
                            </Button>
                          </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Button asChild variant="ghost">
                          <Link to="/auth/login" className="w-full flex items-center"> {/* temporary logout link */}
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                          </Link>
                        </Button>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
              ) : (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" asChild>
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button asChild>
                      <Link to="/register">Register</Link>
                    </Button>
                  </div>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden">
                <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle menu">
                  {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
              <div className="md:hidden border-t">
                <div className="py-2 space-y-1">
                  {user?.role === "attendee" && (
                      <>
                        <Link
                            to="/browse-events"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Browse Events
                        </Link>
                        <Link
                            to="/my-tickets"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          My Tickets
                        </Link>
                        <Link
                            to="/find-organizers"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Find Organizers
                        </Link>
                        <Link
                            to="/wallet"
                            className="flex items-center px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          Wallet
                        </Link>
                      </>
                  )}

                  {user?.role === "organizer" && (
                      <>
                        <Link
                            to="/my-events"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          My Events
                        </Link>
                        <Link
                            to="/create-event"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Create Event
                        </Link>
                        <Link
                            to="/followers"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Followers
                        </Link>
                        <Link
                            to="/analytics"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Analytics
                        </Link>
                      </>
                  )}

                  {user?.role === "admin" && (
                      <>
                        <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                        <Link
                            to="/events"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Manage Events
                        </Link>
                        <Link
                            to="/venues"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Manage Venues
                        </Link>
                        <Link
                            to="/users"
                            className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                            onClick={() => setIsMenuOpen(false)}
                        >
                          Manage Users
                        </Link>
                      </>
                  )}

                  {!user && (
                      <Link
                          to="/browse-events"
                          className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent rounded-md"
                          onClick={() => setIsMenuOpen(false)}
                      >
                        Browse Events
                      </Link>
                  )}
                </div>
              </div>
          )}
        </div>
      </header>
  )
}

export default Navbar