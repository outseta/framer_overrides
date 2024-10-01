/// VERSION 0.0.1

import type { ComponentType, PropsWithChildren } from "react"
import { useEffect, useState } from "react"

/////////////////// Button Overrides

export function withRegisterPopup(Component): ComponentType {
    return (props) => {
        return (
            <Component
                {...props}
                data-o-anonymous="1"
                data-o-auth="1"
                data-mode="popup"
                data-widget-mode="register"
            />
        )
    }
}

export function withLoginPopup(Component): ComponentType {
    return (props) => {
        return (
            <Component
                {...props}
                data-o-anonymous="1"
                data-o-auth="1"
                data-mode="popup"
                data-widget-mode="login"
            />
        )
    }
}

export function withCombinedRegisterLoginPopup(Component): ComponentType {
    return (props) => {
        return (
            <Component
                {...props}
                data-o-anonymous="1"
                data-o-auth="1"
                data-mode="popup"
                data-widget-mode="register|login"
            />
        )
    }
}

export function withProfilePopup(Component): ComponentType {
    return (props) => {
        return (
            <Component
                {...props}
                data-o-authenticated="1"
                data-o-profile="1"
                data-mode="popup"
            />
        )
    }
}

export function withLogout(Component): ComponentType {
    return (props) => {
        return (
            <Component
                {...props}
                data-o-authenticated="1"
                data-o-logout-link="1"
            />
        )
    }
}

/////////////////// Visibility Overrides

export function showForAuthenticated(Component): ComponentType {
    return (props) => {
        return <Component {...props} data-o-authenticated="1" />
    }
}

export function showForAnonymous(Component): ComponentType {
    return (props) => {
        return <Component {...props} data-o-anonymous="1" />
    }
}

/////////// Visibility Overrides Based on Plan Uid
/////// Instruction
// 1. Find the plan uid on the plan page in Outseta
// 2. Replace aWxYEbmV in function name with the plan uid
// 3. Replace the aWxYEbmV value of validPlanUid with the plan uid
// Duplicate function for additional plan uids

export function showForSinglePlan_aWxYEbmV(Component): ComponentType {
    const validPlanUid = "aWxYEbmV"

    return (props) => {
        try {
            const user = useUser()
            const value = user && user["Account.CurrentSubscription.Plan.Uid"]
            if (value === validPlanUid) {
                return <Component {...props} />
            }
            return null
        } catch (error) {
            log("error in showForSinglePlan", validPlanUid, error.message)
            return null
        }
    }
}

/////////// Visibility Based on an Account Custom Property
/////// Instruction
// 1. Give the function as useful name
// 2. Replace the "PARTY" value of validPropertyValue with the uppercase version of the value you want
// 3. Replace MyCustomAccountProperty with the system name of your custom account property
// Duplicate the functions for additional account properties and/or values

export function showForPartyAccounts(Component): ComponentType {
    const validPropertyValue = "PARTY"

    return (props) => {
        try {
            const user = useUser()
            const value =
                user && user["Account.MyCustomAccountProperty"]?.toUpperCase()

            if (value === validPropertyValue) {
                return <Component {...props} />
            }
            return null
        } catch (error) {
            log("error in showForPartyPlan", validPropertyValue, error.message)
            return null
        }
    }
}

/////////// Visibility Based on an Person Custom Property
/////// Instruction
// 1. Give the function a useful name
// 2. Replace the "PARTY" value of validPropertyValue with the uppercase version of the value you want
// 3. Replace MyCustomPersonProperty with the system name of your custom person property
// Duplicate the functions for additional account properties and/or values

export function showForPartyPeople(Component): ComponentType {
    const validPropertyValue = "PARTY"

    return (props) => {
        try {
            const user = useUser()
            const value = user && user["MyCustomPersonProperty"]?.toUpperCase()

            if (value === validPropertyValue) {
                return <Component {...props} />
            }
            return null
        } catch (error) {
            log(
                "error in showForPartyPeople",
                validPropertyValue,
                error.message
            )
            return null
        }
    }
}

/////////////////// Text Overrides

export function withFirstName(Component): ComponentType {
    return withProperty("FirstName", Component)
}

export function withLastName(Component): ComponentType {
    return withProperty("LastName", Component)
}

export function withFullName(Component): ComponentType {
    return withProperty("FullName", Component)
}

export function withEmail(Component): ComponentType {
    return withProperty("Email", Component)
}

export function withAccountName(Component): ComponentType {
    return withProperty("Account.Name", Component)
}

export function withAccountSubscriptionUid(Component): ComponentType {
    return withProperty("Account.CurrentSubscription.Plan.Uid", Component)
}

export function withAccountSubscriptionName(Component): ComponentType {
    return withProperty("Account.CurrentSubscription.Plan.Name", Component)
}

export function withAccountSubscriptionDescription(Component): ComponentType {
    return withProperty(
        "Account.CurrentSubscription.Plan.Description",
        Component
    )
}

/////////////////// Image Overrides

function withImageProperty(property: keyof User, Component: ComponentType) {
    return (props) => {
        const user = useUser()
        if (!user) return null

        const imageSrc = user[property]
        log("avatar source", user[property])

        if (imageSrc) {
            return (
                <Component
                    {...props}
                    background={{
                        ...props.background,
                        src: imageSrc,
                        srcSet: undefined,
                    }}
                />
            )
        } else if (props.background?.src) {
            // Component has image set, use as fallback
            return <Component {...props} />
        } else {
            // Component has no image set, remove
            return null
        }
    }
}

export function withAvatar(Component): ComponentType {
    return withImageProperty("ProfileImageS3Url", Component)
}

/////////////////// INTERNALS

type User = {
    FirstName: string
    LastName: string
    FullName: string
    Email: string
    ProfileImageS3Url: string
    ["Account.Name"]: string
    ["Account.CurrentSubscription.Plan.Uid"]: string
    ["Account.CurrentSubscription.Plan.Name"]: string
    ["Account.CurrentSubscription.Plan.Description"]: string
    // And more depending on what custom properties you have
}

let user: User | null = null
const listeners = new Set<(data: User | null) => void>()

const fetchUser = async (event: string): Promise<void> => {
    try {
        log("fetch user", event)
        const userObject = await getOutseta().getUser()
        user = flattenObject(userObject) as User
        log("fetch user fulfilled", event, userObject, user)
        notifyListeners()
    } catch (error) {
        log("fetch user failed", error)
    }
}

const clearUser = (event: string) => {
    user = null
    // Possible race condition that an earlier
    log("cleared user", event)
    notifyListeners()
}

const notifyListeners = () => {
    listeners.forEach((listener) => listener(user))
}

export const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export const getUser = () => user

// Listen to global events that might change the user
const outsetaFetchUserEvents = [
    "accessToken.set",
    "profile.update",
    "account.update",
]
outsetaFetchUserEvents.forEach((event) => {
    getOutseta()?.on(event, () => fetchUser(event))
})

// Listen to global events that should clear the user
const outsetaClearUserEvents = ["logout"]
outsetaClearUserEvents.forEach((event) => {
    getOutseta()?.on(event, () => clearUser(event))
})

/////////////////// User Hook

function useUser() {
    const [user, setUser] = useState<User | null>(getUser())

    useEffect(() => {
        const updateData = (newData) => setUser(newData)
        const unsubscribe = subscribe(updateData)

        return () => {
            unsubscribe()
        }
    }, [])

    return user
}

function getOutseta() {
    if (window && window["Outseta"]) {
        return window["Outseta"]
    } else if (window) {
        console.log(
            "Outseta is missing, have you added the Outseta Script and Options to the head of the site?"
        )
        alert(
            `We're sorry, but it seems that Outseta is missing. Please reach out to the owner of ${window.location.hostname} to let them know. Thank you for your understanding 🙏`
        )
    } else {
        // Rendering on the server
    }
}

/////////////////// Helpers

function withProperty(property: keyof User, Component: ComponentType) {
    return (props) => {
        const user = useUser()
        if (!user) return null
        return <Component {...props} text={user[property]} />
    }
}

function log(...props) {
    getOutseta()?.debug("outseta.framer.override.user", ...props)
}

function flattenObject(obj, parent = "", res = {}) {
    for (let key in obj) {
        let propName = parent ? `${parent}.${key}` : key
        if (Array.isArray(obj[key])) {
            obj[key].forEach((item, index) => {
                flattenObject(item, `${propName}[${index}]`, res)
            })
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
            flattenObject(obj[key], propName, res)
        } else {
            res[propName] = obj[key]
        }
    }
    return res
}
