import logo from "/bilkent_logo.png";
import {ResetPasswordCard} from "@/components/reset-password-card.jsx";
import {Link} from "react-router-dom";

function ResetPassword(){
    return(
        <>
            <div className="w-screen">
                <div className='flex flex-col justify-center items-center mb-5 -mt-36'>
                    <Link to='/home'>
                        <img src={logo} alt={"Bilkent Logo"} className='h-32  mb-2'/>
                    </Link>
                    <h1 className='font-mono font-bold text-lg'>B.I.O.T.S</h1>
                </div>
                <div className='pt-10'>
                    <ResetPasswordCard/>
                </div>
            </div>
        </>
    )
}

export default ResetPassword