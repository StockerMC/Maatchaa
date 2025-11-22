"""
Email utilities for partnerships outreach
"""
import os
import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Dict, List
from dotenv import load_dotenv

load_dotenv()


def extract_social_links(text: str) -> Dict[str, Optional[str]]:
    """
    Extract social media links from text (YouTube channel description)

    Args:
        text: Channel description or about text

    Returns:
        Dict with keys: instagram, tiktok, twitter, other_links
    """
    social_links = {
        "instagram": None,
        "tiktok": None,
        "twitter": None,
        "other_links": []
    }

    if not text:
        return social_links

    # Instagram patterns
    ig_patterns = [
        r'instagram\.com/([a-zA-Z0-9._]+)',
        r'@([a-zA-Z0-9._]+).*instagram',
        r'ig[:\s]+@?([a-zA-Z0-9._]+)'
    ]
    for pattern in ig_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            username = match.group(1).strip('@')
            social_links["instagram"] = f"https://instagram.com/{username}"
            break

    # TikTok patterns
    tiktok_patterns = [
        r'tiktok\.com/@([a-zA-Z0-9._]+)',
        r'@([a-zA-Z0-9._]+).*tiktok',
        r'tt[:\s]+@?([a-zA-Z0-9._]+)'
    ]
    for pattern in tiktok_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            username = match.group(1).strip('@')
            social_links["tiktok"] = f"https://tiktok.com/@{username}"
            break

    # Twitter/X patterns
    twitter_patterns = [
        r'twitter\.com/([a-zA-Z0-9._]+)',
        r'x\.com/([a-zA-Z0-9._]+)',
        r'@([a-zA-Z0-9._]+).*(?:twitter|x\.com)',
    ]
    for pattern in twitter_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            username = match.group(1).strip('@')
            social_links["twitter"] = f"https://twitter.com/{username}"
            break

    # Extract any other URLs
    url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
    urls = re.findall(url_pattern, text)
    # Filter out the ones we already captured
    other_urls = [
        url for url in urls
        if not any(x in url for x in ['instagram.com', 'tiktok.com', 'twitter.com', 'x.com', 'youtube.com'])
    ]
    social_links["other_links"] = other_urls[:3]  # Limit to 3

    return social_links


async def get_creator_contact_info(channel_id: str, channel_description: str = None) -> Dict:
    """
    Get contact information for a creator

    Strategy:
    1. Try to extract email from channel description
    2. Extract social media links from description
    3. Return both for fallback options

    Args:
        channel_id: YouTube channel ID
        channel_description: Channel description text (optional)

    Returns:
        Dict with keys: email, social_links, channel_url
    """
    from utils.yt_search import get_channel_email

    contact_info = {
        "email": None,
        "social_links": {
            "instagram": None,
            "tiktok": None,
            "twitter": None,
            "other_links": []
        },
        "channel_url": f"https://youtube.com/channel/{channel_id}"
    }

    # Try to get email
    try:
        email = await get_channel_email(channel_id)
        if email and email != os.getenv("DEFAULT_EMAIL"):
            contact_info["email"] = email
    except Exception as e:
        print(f"Could not fetch email for channel {channel_id}: {e}")

    # Extract social links from description if provided
    if channel_description:
        social_links = extract_social_links(channel_description)
        contact_info["social_links"] = social_links

    return contact_info


def create_partnership_email_template(
    creator_name: str,
    shop_name: str,
    products: List[Dict],
    custom_message: str = None,
    partnership_url: str = None
) -> str:
    """
    Create a default partnership outreach email template

    Args:
        creator_name: Name of the creator
        shop_name: Name of the shop/brand
        products: List of product dicts with 'title' key
        custom_message: Optional custom message to include
        partnership_url: URL to partnership management page

    Returns:
        HTML email content
    """
    product_names = ", ".join([p.get("title", p.get("name", "")) for p in products[:3]])
    if len(products) > 3:
        product_names += f" and {len(products) - 3} more"

    default_message = f"""We love your content and think your audience would be a perfect fit for our products!

We'd like to explore a partnership opportunity with you to feature our {product_names}.

We offer competitive commission rates and would love to discuss how we can work together to create authentic content that resonates with your audience."""

    message_body = custom_message if custom_message else default_message

    html = f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2d3748;">Partnership Opportunity with {shop_name}</h2>

            <p>Hi {creator_name},</p>

            <p>{message_body}</p>

            {f'''
            <div style="margin: 30px 0; padding: 20px; background: #f5f5f5; border-radius: 8px; text-align: center;">
                <a href="{partnership_url}"
                   style="display: inline-block; padding: 12px 24px; background: #5c9a31; color: white;
                          text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                    Review & Accept Partnership
                </a>
                <p style="margin-top: 10px; font-size: 12px; color: #666;">
                    Click the button above to view partnership details and accept
                </p>
            </div>
            ''' if partnership_url else '''
            <p>If you're interested, please reply to this email and we can discuss the details further!</p>
            '''}

            <p>Best regards,<br>
            The {shop_name} Team</p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">

            <p style="font-size: 12px; color: #718096;">
                This is an automated email sent via our partnership platform.
            </p>
        </div>
    </body>
    </html>
    """

    return html


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    from_name: str = None
) -> tuple[bool, str]:
    """
    Send an email using Gmail SMTP

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML email content
        from_name: Optional sender name (defaults to EMAIL_SENDER)

    Returns:
        Tuple of (success: bool, message: str)
    """
    sender_email = os.getenv("EMAIL_SENDER")
    sender_password = os.getenv("EMAIL_APP_PASSWORD")

    if not sender_email or not sender_password:
        return False, "Email credentials not configured in .env"

    if not to_email:
        return False, "Recipient email is required"

    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"{from_name} <{sender_email}>" if from_name else sender_email
        message["To"] = to_email

        # Attach HTML content
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)

        # Send via Gmail SMTP
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(sender_email, sender_password)
            server.send_message(message)

        return True, f"Email sent successfully to {to_email}"

    except smtplib.SMTPAuthenticationError:
        return False, "Email authentication failed - check EMAIL_APP_PASSWORD in .env"
    except smtplib.SMTPException as e:
        return False, f"SMTP error: {str(e)}"
    except Exception as e:
        return False, f"Failed to send email: {str(e)}"


async def send_partnership_email(
    to_email: str,
    creator_name: str,
    shop_name: str,
    products: List[Dict],
    custom_message: str = None,
    partnership_url: str = None
) -> tuple[bool, str]:
    """
    Send a partnership outreach email to a creator

    Args:
        to_email: Creator's email address
        creator_name: Name of the creator
        shop_name: Name of the shop/brand
        products: List of matched products
        custom_message: Optional custom message
        partnership_url: URL to partnership management page

    Returns:
        Tuple of (success: bool, message: str)
    """
    subject = f"Partnership Opportunity with {shop_name}"
    html_content = create_partnership_email_template(
        creator_name=creator_name,
        shop_name=shop_name,
        products=products,
        custom_message=custom_message,
        partnership_url=partnership_url
    )

    return send_email(
        to_email=to_email,
        subject=subject,
        html_content=html_content,
        from_name=shop_name
    )
