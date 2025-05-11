'use client'

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next';
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
import useForgotPassword from "../hooks/auth/useForgotPassword.js";
import { Alert, AlertDescription } from "@/components/ui/alert.jsx";

export function ForgotPasswordCard() {
    const { t } = useTranslation();
    const [emailError, setEmailError] = useState("")
    const [email, setEmail] = useState("")
    const [success, error, forgotPassword] = useForgotPassword();

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return re.test(String(email).toLowerCase())
    }

    const handleEmailChange = (e) => {
        setEmail(e.target.value)
        setEmailError(validateEmail(e.target.value) ? "" : t('forgotPassword.email.error'))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (validateEmail(email)) {
            forgotPassword(email)
        } else {
            setEmailError(t('forgotPassword.email.error'))
        }
    }

    return (
        <div className="flex items-center justify-center">
            <Card className="w-[450px]">
                {success ? (
                    <div className="flex justify-center w-full p-6">
                        <Alert className="w-4/5 max-w-2xl border-none">
                            <div className="flex items-center space-x-2">
                                <AlertDescription className="text-center font-semibold text-sm text-center">
                                    {t('forgotPassword.success')}
                                </AlertDescription>
                            </div>
                        </Alert>
                    </div>
                ) : (
                    <>
                        <CardHeader>
                            <CardTitle>{t('forgotPassword.title')}</CardTitle>
                            <CardDescription>{t('forgotPassword.description')}</CardDescription>
                            {error && (
                                <Alert className="text-center text-red-500 font-semibold border-none">
                                    <AlertDescription>
                                        {error}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit}>
                                <div className="grid w-full items-center gap-4">
                                    <div className="flex flex-col space-y-1.5">
                                        <Label htmlFor="email">{t('forgotPassword.email.label')}</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder={t('forgotPassword.email.placeholder')}
                                            value={email}
                                            onChange={handleEmailChange}
                                            required
                                        />
                                        {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                                    </div>
                                </div>
                                <Button type="submit" className="w-full mt-6">
                                    {t('forgotPassword.submit')}
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}
                <CardFooter className="flex flex-col space-y-2 w-full">
                    <Link to="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            {t('forgotPassword.backToLogin')}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}