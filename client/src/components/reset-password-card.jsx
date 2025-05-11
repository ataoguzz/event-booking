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
import useResetPassword from "../hooks/auth/useResetPassword.js";
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip.jsx";
import {Info} from "lucide-react";
import {Alert, AlertDescription} from "@/components/ui/alert.jsx";

import useQuery from "@/hooks/util/useQuery.js";
import {useAuth} from "@/contexts/AuthContext.jsx";

export function ResetPasswordCard() {
    const { t } = useTranslation();
    const {user} = useAuth()
    const [password, setPassword] = useState("")
    const [repeatPassword, setRepeatPassword] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [repeatPasswordError, setRepeatPasswordError] = useState("")
    const [success, error, resetPassword] = useResetPassword();

    const query = useQuery();
    const token = query.get("token");
    const userId = query.get("id");

    const validatePassword = (password) => {
        const hasUpperCase = /[A-Z]/.test(password)
        const hasLowerCase = /[a-z]/.test(password)
        const hasMinLength = password.length >= 8
        return hasUpperCase && hasLowerCase && hasMinLength
    }

    const handlePasswordChange = (e) => {
        setPassword(e.target.value)
        setPasswordError(validatePassword(e.target.value)
            ? ""
            : t('resetPassword.validation.password.error'))
    }

    const handleRepeatPasswordChange = (e) => {
        setRepeatPassword(e.target.value)
        setRepeatPasswordError(e.target.value === password ? "" : t('resetPassword.validation.match'))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        if (validatePassword(password) && password === repeatPassword) {
            resetPassword(password, token, userId)
        } else {
            setPasswordError(validatePassword(password)
                ? ""
                : t('resetPassword.validation.password.error'))
            setRepeatPasswordError(password === repeatPassword ? "" : t('resetPassword.validation.match'))
        }
    }

    return (
        <div className="flex items-center justify-center">
            <Card className="w-[450px]">
                {success ? (<div className="flex justify-center w-full p-6">
                        <Alert
                            className="text-center border-none">
                                <AlertDescription className="text-center font-semibold text-sm text-center">
                                    {t('resetPassword.success')}
                                </AlertDescription>
                        </Alert>
                    </div>
                ) : (<> <CardHeader>
                    <CardTitle>{t('resetPassword.title')}</CardTitle>
                    <CardDescription>{t('resetPassword.description')}</CardDescription>
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
                                    <Label htmlFor="signup-password">{t('resetPassword.form.newPassword.label')}</Label>
                                    <div className="relative">
                                        <Input
                                            id="signup-password"
                                            type="password"
                                            placeholder={t('resetPassword.form.newPassword.placeholder')}
                                            value={password}
                                            onChange={handlePasswordChange}
                                            required
                                        />
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info
                                                        className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"/>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{t('resetPassword.validation.password.requirements.title')}</p>
                                                    <ul className="list-disc list-inside">
                                                        <li>{t('resetPassword.validation.password.requirements.length')}</li>
                                                        <li>{t('resetPassword.validation.password.requirements.uppercase')}</li>
                                                        <li>{t('resetPassword.validation.password.requirements.lowercase')}</li>
                                                    </ul>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                                </div>
                                <div className="flex flex-col space-y-1.5">
                                    <Label htmlFor="repeat-password">{t('resetPassword.form.repeatPassword.label')}</Label>
                                    <Input
                                        id="repeat-password"
                                        type="password"
                                        placeholder={t('resetPassword.form.repeatPassword.placeholder')}
                                        value={repeatPassword}
                                        onChange={handleRepeatPasswordChange}
                                        required
                                    />
                                    {repeatPasswordError && <p className="text-sm text-red-500">{repeatPasswordError}</p>}
                                </div>
                            </div>
                            <Button type="submit" className="w-full mt-6">
                                {t('resetPassword.form.submit')}
                            </Button>
                        </form>
                    </CardContent> </>)}
                <CardFooter className="flex flex-col space-y-2 w-full">
                    <Link to="/login" className="w-full">
                        <Button variant="outline" className="w-full">
                            {t('resetPassword.form.backToLogin')}
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </div>
    )
}