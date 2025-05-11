'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
import { Navigate } from "react-router-dom";
import { Link } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useLogin from "@/hooks/auth/useLogin.js";

export function LoginCard() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailError, setEmailError] = useState("")

  const { user, error, login } = useLogin()

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return re.test(String(email).toLowerCase())
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    setEmailError(validateEmail(e.target.value) ? "" : t('login.form.email.error'))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validateEmail(email)) {
      login({ email, password })
    } else {
      setEmailError(t('login.form.email.error'))
    }
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <>
      {user && <Navigate to="/home" replace />}
      <div className="flex items-center justify-center">
        <Card className="w-[350px]">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>{t('login.title')}</CardTitle>
              <div className="flex gap-2">
                <button
                  onClick={() => changeLanguage('tr')}
                  className={`text-sm ${i18n.language === 'tr' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                >
                  TR
                </button>
                <span className="text-muted-foreground">-</span>
                <button
                  onClick={() => changeLanguage('en')}
                  className={`text-sm ${i18n.language === 'en' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                >
                  EN
                </button>
                <span className="text-muted-foreground">-</span>
                <button
                  onClick={() => changeLanguage('fr')}
                  className={`text-sm ${i18n.language === 'fr' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                >
                  FR
                </button>
                <span className="text-muted-foreground">-</span>
                <button
                  onClick={() => changeLanguage('de')}
                  className={`text-sm ${i18n.language === 'de' ? 'font-bold text-primary' : 'text-muted-foreground'}`}
                >
                  DE
                </button>
              </div>
            </div>
            <CardDescription>{t('login.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">{t('login.form.email.label')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('login.form.email.placeholder')}
                    value={email}
                    onChange={handleEmailChange}
                    required
                  />
                  {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">{t('login.form.password.label')}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t('login.form.password.placeholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}

              <Button type="submit" className="w-full mt-6">
                {t('login.form.submit')}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 w-full">
            <div className="text-sm text-center">
              <Link to="/auth/forgot-password" className="text-primary hover:underline">
                {t('login.links.forgotPassword')}
              </Link>
            </div>
            <Link to="/auth/signup" className="w-full">
              <Button variant="outline" className="w-full">
                {t('login.links.signup')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}