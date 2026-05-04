let sharedCart = [];
let sharedCustomer = "";

export const setSharedCart = (cart) => { sharedCart = cart; };
export const getSharedCart = () => sharedCart;

export const setSharedCustomer = (customer) => { sharedCustomer = customer; };
export const getSharedCustomer = () => sharedCustomer;

export const clearSharedPOS = () => {
  sharedCart = [];
  sharedCustomer = "";
};
