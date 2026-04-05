import frappe

no_cache = 1


def get_context(context):
    company = frappe.get_all(
        "Company",
        fields=["company_name", "company_logo"],
        order_by="creation desc",
        limit=1,
    )

    company_name = "Rashakatech"
    company_logo = None

    if company:
        company_name = company[0].get("company_name") or company_name
        company_logo = company[0].get("company_logo")

    context.company_name = company_name
    context.company_logo = company_logo
    context.icon_192 = company_logo or "/assets/rashakatech/icons/pwa-192.svg"
    context.icon_512 = company_logo or "/assets/rashakatech/icons/pwa-512.svg"
