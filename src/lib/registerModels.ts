/**
 * Side-effect imports so Mongoose schemas exist before `.populate()` runs.
 * Without this, cold API routes can throw "Schema hasn't been registered for model User".
 */
import "@/model/user.model";
import "@/model/product.model";
import "@/model/order.model";
