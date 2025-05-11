'use client'

import React, {useState} from 'react'
import { useTranslation } from 'react-i18next';
import {Navigate, useNavigate} from "react-router-dom"

import {Link} from 'react-router-dom'
import {Info} from 'lucide-react'
import {Button} from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription, CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {Input} from "@/components/ui/input"
import {Label} from "@/components/ui/label"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

import useSignup from "@/hooks/auth/useSignup.js";

export function SignupCard() {
    const { t } = useTranslation();
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [repeatPassword, setRepeatPassword] = useState("")
    const [phoneNumber, setPhoneNumber] = useState("")
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [repeatPasswordError, setRepeatPasswordError] = useState("")

    const navigate = useNavigate();

    const {user, error, signup} = useSignup()

    const validateEmail = (email) => {
        const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return re.test(String(email).toLowerCase());
    }

    const validatePassword = (password) => {
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasMinLength = password.length >= 8
        return hasUpperCase && hasLowerCase && hasMinLength
    }

    const handleEmailChange = (e) => {
        setEmail(e.target.value)
        setEmailError(validateEmail(e.target.value) ? "" : t('signup.form.email.error'))
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value)
        setPasswordError(validatePassword(e.target.value)
            ? ""
            : t('signup.form.password.error'))
    }

    const handleRepeatPasswordChange = (e) => {
        setRepeatPassword(e.target.value)
        setRepeatPasswordError(e.target.value === password ? "" : t('signup.form.repeatPassword.error'))
    }

    const handlePhoneNumberChange = (e) => {
        setPhoneNumber(e.target.value)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (validateEmail(email) && validatePassword(password) && password === repeatPassword) {
            signup({email, password, phoneNumber})
        } else {
            setEmailError(validateEmail(email) ? "" : t('signup.form.email.error'))
            setPasswordError(validatePassword(password)
                ? ""
                : t('signup.form.password.error'))
            setRepeatPasswordError(password === repeatPassword ? "" : t('signup.form.repeatPassword.error'))
        }
    }

    if(user){
        return <Navigate to="/home" replace/>;
    }
    return (
        <>
            <div className="flex items-center justify-center">
                <Card className="w-[700px]">
                    <CardHeader>
                        <CardTitle>{t('signup.title')}</CardTitle>
                        <CardDescription>{t('signup.description')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="signup-email">{t('signup.form.email.label')}</Label>
                                    <Input
                                        id="signup-email"
                                        type="email"
                                        placeholder={t('signup.form.email.placeholder')}
                                        value={email}
                                        onChange={handleEmailChange}
                                        required
                                    />
                                    {emailError && <p className="text-sm text-red-500">{emailError}</p>}
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="signup-password">{t('signup.form.password.label')}</Label>
                                    <div className="relative">
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            placeholder={t('signup.form.password.placeholder')}
                                            value={password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"/>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('signup.form.password.requirements.title')}</p>
                                                    <ul className="list-disc list-inside">
                                                        <li>{t('signup.form.password.requirements.length')}</li>
                                                        <li>{t('signup.form.password.requirements.uppercase')}</li>
                                                        <li>{t('signup.form.password.requirements.lowercase')}</li>
                                                    </ul>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="repeat-password">{t('signup.form.repeatPassword.label')}</Label>
                                    <Input
                                        id="repeat-password"
                                        type="password"
                                        placeholder={t('signup.form.repeatPassword.placeholder')}
                                        value={repeatPassword}
                                        onChange={handleRepeatPasswordChange}
                                        required
                                    />
                                    {repeatPasswordError && <p className="text-sm text-red-500">{repeatPasswordError}</p>}
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="phone-number">Phone Number</Label>
                                    <Input
                                        id="phone-number"
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        value={phoneNumber}
                                        onChange={handlePhoneNumberChange}
                                    />
                                </div>
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 mt-2">{t('signup.error.emailExists')}</p>
                            )}

                            <Button type="submit" className="w-full mt-6">
                                {t('signup.submit')}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2 w-full">
                        <Link to="/login" className="w-full">
                            <Button variant="outline" className="w-full">
                                {t('signup.login.prompt')}
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
}
