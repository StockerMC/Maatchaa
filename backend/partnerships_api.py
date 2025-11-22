"""
Partnerships API endpoints

Add these to API.py at the end of the file
"""

# ============================================================================
# PARTNERSHIPS ENDPOINTS
# ============================================================================

@get("/partnerships")
async def get_partnerships(request: Request):
    """
    Get all partnerships for a company

    Query params:
        - company_id: The company ID (required)
        - status: Filter by status (optional)
    """
    try:
        assert supabase_client

        company_id = request.query.get("company_id")
        if isinstance(company_id, list):
            company_id = company_id[0] if company_id else None

        if not company_id:
            return json({"error": "Missing company_id parameter"}, status=400)

        # Build query
        query = supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("company_id", company_id)\
            .order("created_at", desc=True)

        # Optional status filter
        status_filter = request.query.get("status")
        if isinstance(status_filter, list):
            status_filter = status_filter[0] if status_filter else None

        if status_filter:
            query = query.eq("status", status_filter)

        result = await query.execute()

        return json({
            "partnerships": result.data or [],
            "count": len(result.data) if result.data else 0
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@get("/partnerships/<partnership_id>")
async def get_partnership(partnership_id: str):
    """
    Get a single partnership by ID
    """
    try:
        assert supabase_client

        result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not result.data:
            return json({"error": "Partnership not found"}, status=404)

        return json(result.data)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@post("/partnerships")
async def create_partnership(request: Request):
    """
    Create a new partnership from a creator video match

    Body:
        - company_id: UUID (required)
        - video_id: string - YouTube video ID (required)
        - creator_name: string (required)
        - creator_handle: string
        - creator_email: string (optional)
        - creator_avatar: string (optional)
        - creator_channel_url: string (optional)
        - creator_channel_id: string (optional)
        - video_title: string (required)
        - video_url: string (required)
        - video_thumbnail: string (optional)
        - video_description: string (optional - for extracting contact info)
        - matched_products: array of product objects (optional)
        - views: integer (optional)
        - likes: integer (optional)
        - comments: integer (optional)
    """
    try:
        assert supabase_client

        data = await request.json()

        # Validate required fields
        if not data.get("company_id"):
            return json({"error": "company_id is required"}, status=400)
        if not data.get("video_id"):
            return json({"error": "video_id is required"}, status=400)
        if not data.get("creator_name"):
            return json({"error": "creator_name is required"}, status=400)
        if not data.get("video_title"):
            return json({"error": "video_title is required"}, status=400)
        if not data.get("video_url"):
            return json({"error": "video_url is required"}, status=400)

        # Check for duplicate (same company + video)
        existing = await supabase_client.client.table("partnerships")\
            .select("id")\
            .eq("company_id", data["company_id"])\
            .eq("video_url", data["video_url"])\
            .execute()

        if existing.data:
            return json({
                "error": "Partnership already exists for this video",
                "partnership_id": existing.data[0]["id"]
            }, status=409)

        # Try to get contact info if channel_id provided
        contact_info = None
        if data.get("creator_channel_id"):
            from utils.email import get_creator_contact_info
            contact_info = await get_creator_contact_info(
                channel_id=data["creator_channel_id"],
                channel_description=data.get("video_description")
            )

        # Create partnership
        partnership_data = {
            "company_id": data["company_id"],
            "video_id": data.get("video_id"),
            "creator_name": data["creator_name"],
            "creator_handle": data.get("creator_handle"),
            "creator_email": data.get("creator_email") or (contact_info.get("email") if contact_info else None),
            "creator_avatar": data.get("creator_avatar"),
            "creator_channel_url": data.get("creator_channel_url") or (contact_info.get("channel_url") if contact_info else None),
            "video_title": data["video_title"],
            "video_url": data["video_url"],
            "video_thumbnail": data.get("video_thumbnail"),
            "matched_products": data.get("matched_products", []),
            "views": data.get("views", 0),
            "likes": data.get("likes", 0),
            "comments": data.get("comments", 0),
            "status": "to_contact",
            "created_at": "now()"
        }

        result = await supabase_client.client.table("partnerships")\
            .insert(partnership_data)\
            .execute()

        partnership = result.data[0] if result.data else None

        # Add contact info to response
        if partnership and contact_info:
            partnership["_contact_info"] = contact_info["social_links"]

        return json({
            "message": "Partnership created successfully",
            "partnership": partnership
        }, status=201)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@patch("/partnerships/<partnership_id>")
async def update_partnership(partnership_id: str, request: Request):
    """
    Update a partnership

    Body (all optional):
        - status: string (to_contact, contacted, in_discussion, active, closed)
        - creator_email: string
        - email_sent: boolean
        - email_draft: string
        - notes: string
        - contract_drafted: boolean
        - contract_sent: boolean
        - contract_signed: boolean
        - contract_url: string
        - affiliate_link: string
        - affiliate_link_generated: boolean
        - discount_code: string
        - commission_rate: decimal
        - payment_terms: string
        - clicks: integer
        - sales: integer
        - revenue: decimal
        - performance_data: object
    """
    try:
        assert supabase_client

        data = await request.json()

        # Build update object
        update_data = {}

        # Status updates with timestamp tracking
        if "status" in data:
            update_data["status"] = data["status"]
            if data["status"] == "contacted":
                update_data["contacted_at"] = "now()"
            elif data["status"] == "in_discussion":
                update_data["discussion_started_at"] = "now()"
            elif data["status"] == "active":
                update_data["activated_at"] = "now()"
            elif data["status"] == "closed":
                update_data["closed_at"] = "now()"

        # Email fields
        if "creator_email" in data:
            update_data["creator_email"] = data["creator_email"]
        if "email_sent" in data:
            update_data["email_sent"] = data["email_sent"]
            if data["email_sent"]:
                update_data["last_contact_date"] = "now()"
        if "email_draft" in data:
            update_data["email_draft"] = data["email_draft"]

        # Contract fields
        if "contract_drafted" in data:
            update_data["contract_drafted"] = data["contract_drafted"]
        if "contract_sent" in data:
            update_data["contract_sent"] = data["contract_sent"]
        if "contract_signed" in data:
            update_data["contract_signed"] = data["contract_signed"]
        if "contract_url" in data:
            update_data["contract_url"] = data["contract_url"]
        if "contract_data" in data:
            update_data["contract_data"] = data["contract_data"]

        # Affiliate fields
        if "affiliate_link" in data:
            update_data["affiliate_link"] = data["affiliate_link"]
        if "affiliate_link_generated" in data:
            update_data["affiliate_link_generated"] = data["affiliate_link_generated"]
        if "discount_code" in data:
            update_data["discount_code"] = data["discount_code"]
        if "commission_rate" in data:
            update_data["commission_rate"] = data["commission_rate"]
        if "payment_terms" in data:
            update_data["payment_terms"] = data["payment_terms"]

        # Performance tracking
        if "clicks" in data:
            update_data["clicks"] = data["clicks"]
        if "sales" in data:
            update_data["sales"] = data["sales"]
        if "revenue" in data:
            update_data["revenue"] = data["revenue"]
        if "performance_data" in data:
            update_data["performance_data"] = data["performance_data"]

        # Notes
        if "notes" in data:
            update_data["notes"] = data["notes"]

        if not update_data:
            return json({"error": "No valid fields to update"}, status=400)

        # Perform update
        result = await supabase_client.client.table("partnerships")\
            .update(update_data)\
            .eq("id", partnership_id)\
            .execute()

        if not result.data:
            return json({"error": "Partnership not found"}, status=404)

        return json({
            "message": "Partnership updated successfully",
            "partnership": result.data[0] if result.data else None
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@get("/partnerships/<partnership_id>/contact-info")
async def get_partnership_contact_info(partnership_id: str):
    """
    Get contact information for a partnership's creator

    Returns email and social media links
    """
    try:
        assert supabase_client

        # Get partnership
        partnership_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not partnership_result.data:
            return json({"error": "Partnership not found"}, status=404)

        partnership = partnership_result.data

        # If we have video_id, get the video details
        video_description = None
        channel_id = None

        if partnership.get("video_id"):
            video_result = await supabase_client.client.table("creator_videos")\
                .select("description, channel_id")\
                .eq("video_id", partnership["video_id"])\
                .single()\
                .execute()

            if video_result.data:
                video_description = video_result.data.get("description")
                channel_id = video_result.data.get("channel_id")

        # Extract channel ID from URL if not found
        if not channel_id and partnership.get("creator_channel_url"):
            import re
            match = re.search(r'/channel/([^/\s]+)', partnership["creator_channel_url"])
            if match:
                channel_id = match.group(1)

        # Get contact info
        contact_info = {
            "email": partnership.get("creator_email"),
            "social_links": {
                "instagram": None,
                "tiktok": None,
                "twitter": None,
                "other_links": []
            },
            "channel_url": partnership.get("creator_channel_url")
        }

        if channel_id:
            from utils.email import get_creator_contact_info
            fetched_info = await get_creator_contact_info(
                channel_id=channel_id,
                channel_description=video_description
            )
            # Merge with existing info (prefer existing email if set)
            if not contact_info["email"]:
                contact_info["email"] = fetched_info.get("email")
            contact_info["social_links"] = fetched_info.get("social_links", contact_info["social_links"])
            if not contact_info["channel_url"]:
                contact_info["channel_url"] = fetched_info.get("channel_url")

        return json(contact_info)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@post("/partnerships/<partnership_id>/send-email")
async def send_partnership_email_endpoint(partnership_id: str, request: Request):
    """
    Send partnership outreach email to creator

    Body:
        - to_email: string (required if not in partnership record)
        - custom_message: string (optional - custom message to include)
        - save_email: boolean (default true - whether to update partnership record)
    """
    try:
        assert supabase_client

        data = await request.json()

        # Get partnership
        partnership_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not partnership_result.data:
            return json({"error": "Partnership not found"}, status=404)

        partnership = partnership_result.data

        # Get email
        to_email = data.get("to_email") or partnership.get("creator_email")
        if not to_email:
            return json({"error": "Email address is required"}, status=400)

        # Get shop info
        shop_result = await supabase_client.client.table("shopify_shops")\
            .select("shop_name")\
            .eq("company_id", partnership["company_id"])\
            .single()\
            .execute()

        shop_name = shop_result.data.get("shop_name") if shop_result.data else "Our Brand"

        # Send email
        from utils.email import send_partnership_email

        success, message = await send_partnership_email(
            to_email=to_email,
            creator_name=partnership["creator_name"],
            shop_name=shop_name,
            products=partnership.get("matched_products", []),
            custom_message=data.get("custom_message")
        )

        if not success:
            return json({"error": message}, status=500)

        # Update partnership record if requested
        if data.get("save_email", True):
            update_data = {
                "email_sent": True,
                "last_contact_date": "now()",
                "status": "contacted",
                "contacted_at": "now()"
            }

            # Save email if it was provided and different
            if data.get("to_email") and data["to_email"] != partnership.get("creator_email"):
                update_data["creator_email"] = data["to_email"]

            # Save custom message as draft if provided
            if data.get("custom_message"):
                update_data["email_draft"] = data["custom_message"]

            await supabase_client.client.table("partnerships")\
                .update(update_data)\
                .eq("id", partnership_id)\
                .execute()

        return json({
            "message": "Email sent successfully",
            "to": to_email
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)


@post("/partnerships/<partnership_id>/generate-affiliate")
async def generate_affiliate_link_endpoint(partnership_id: str, request: Request):
    """
    Generate affiliate tracking link and optionally create Shopify discount code

    Body:
        - commission_rate: decimal (optional - default 10%)
        - create_discount: boolean (optional - default false)
        - discount_amount: decimal (optional - default 10)
        - discount_type: string (optional - "percentage" or "fixed", default "percentage")
    """
    try:
        assert supabase_client

        data = await request.json()

        # Get partnership
        partnership_result = await supabase_client.client.table("partnerships")\
            .select("*")\
            .eq("id", partnership_id)\
            .single()\
            .execute()

        if not partnership_result.data:
            return json({"error": "Partnership not found"}, status=404)

        partnership = partnership_result.data

        # Get shop domain
        shop_result = await supabase_client.client.table("shopify_shops")\
            .select("shop_domain, myshopify_domain")\
            .eq("company_id", partnership["company_id"])\
            .single()\
            .execute()

        if not shop_result.data:
            return json({"error": "Shop not found"}, status=404)

        shop_domain = shop_result.data.get("shop_domain") or shop_result.data.get("myshopify_domain")

        # Generate affiliate link
        creator_handle = partnership.get("creator_handle") or ""
        if creator_handle:
            creator_handle = creator_handle.strip('@').lower()

        if not creator_handle:
            # Fallback to creator name
            creator_handle = (partnership.get("creator_name") or "creator").lower().replace(" ", "")

        affiliate_link = f"https://{shop_domain}/ref/{creator_handle}?pid={partnership_id}"

        # Optionally create Shopify discount code
        discount_code = None
        if data.get("create_discount", False):
            from utils.shopify_api import create_discount_code, get_access_token

            try:
                access_token = await get_access_token(partnership["company_id"])
                if access_token:
                    discount_amount = data.get("discount_amount", 10)
                    discount_type = data.get("discount_type", "percentage")

                    discount_code = f"{creator_handle.upper()}{discount_amount}"

                    # Create discount in Shopify
                    created = await create_discount_code(
                        shop=shop_result.data.get("myshopify_domain"),
                        access_token=access_token,
                        code=discount_code,
                        value=discount_amount,
                        value_type=discount_type
                    )

                    if not created:
                        discount_code = None  # Failed to create
            except Exception as e:
                print(f"Failed to create Shopify discount: {e}")
                # Continue without discount code

        # Update partnership
        update_data = {
            "affiliate_link": affiliate_link,
            "affiliate_link_generated": True,
            "commission_rate": data.get("commission_rate", 10)
        }

        if discount_code:
            update_data["discount_code"] = discount_code

        result = await supabase_client.client.table("partnerships")\
            .update(update_data)\
            .eq("id", partnership_id)\
            .execute()

        return json({
            "message": "Affiliate link generated successfully",
            "affiliate_link": affiliate_link,
            "discount_code": discount_code,
            "partnership": result.data[0] if result.data else None
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return json({"error": str(e)}, status=500)
