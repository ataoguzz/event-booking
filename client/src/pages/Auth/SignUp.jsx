import logo from "/bilkent_logo.png";
import {SignupCard} from "@/components/signup-card.jsx";
import {Link} from "react-router-dom";
import {LoginCard} from "@/components/login-card.jsx";

function Signup(){
    return(
        <>
            <div
                className="w-screen h-screen bg-auto bg-center"
                style={{backgroundImage: "url('/bg.jpg')"}}
            >
                <div className="absolute inset-0 bg-white bg-opacity-60">
                    <div className='flex flex-col justify-center items-center  mb-4 mt-2'>
                        <Link to='/home'>
                            <img src={logo} alt={"Bilkent Logo"} className='h-32  mb-2'/>
                        </Link>
                        <h1 className='font-mono font-bold text-lg'>B.I.O.T.S</h1>
                    </div>
                    <div className=''>
                        <SignupCard/>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Signup