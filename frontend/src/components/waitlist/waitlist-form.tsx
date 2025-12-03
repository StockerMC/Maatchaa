"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@radix-ui/themes";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

export function WaitlistForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("waitlist")
        .insert([
          {
            email: email.toLowerCase().trim(),
            name: null,
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        if (error.code === "23505") {
          toast.error("This email is already on the waitlist!");
        } else {
          console.error("Error submitting to waitlist:", error);
          toast.error("Something went wrong. Please try again.");
        }
      } else {
        setEmail("");
        toast.success("You're on the list! We'll be in touch soon.");
      }
    } catch (error) {
      console.error("Error submitting to waitlist:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative w-full max-w-[500px] mx-auto">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
          required
          className="w-full h-12 px-5 pr-40 rounded-full border-2 border-gray-300 focus:border-lime-500 focus:outline-none text-base transition-colors"
          style={{
            backgroundColor: 'white',
          }}
        />
        <div style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)' }}>
          <Button
            type="submit"
            size="1"
            variant="classic"
            color="lime"
            disabled={isSubmitting}
            className="whitespace-nowrap text-sm rounded-full"
            style={{ borderRadius: '9999px', height: '36px', paddingLeft: '16px', paddingRight: '16px' }}
          >
            {isSubmitting ? "Joining..." : "Join Waitlist"}
          </Button>
        </div>
      </div>
    </form>
  );
}
