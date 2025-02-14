"use client";
import Image from 'next/image';
import './logo.css';
import { useEffect, useState } from "react";

const Logo = () => {

  return (
    <div>
      <Image className='logo' src='/Bodyline Black.png' alt='' width={180} height={25} unoptimized/>
    </div>
  );
}

export default Logo;