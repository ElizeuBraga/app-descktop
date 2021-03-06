import Swal from "sweetalert2";
import { DB } from '../models/DB';
import EventBus from '../EventBus';
import { Payment } from '../models/Payment';
import { Cashier } from '../models/Cashier';
import { PaymentCashier } from '../models/PaymentCashier';
export default {
    data() {
        return {
            tabIndex: 0,
            paymentInfo: [],
            paymentsFormats: [],
            cashierIsOpen: false,
            bluePrimary: "#2778c4",
        }
    },

    async created() {
        EventBus.$on("change-tab", (e) => {
            this.tabIndex = e;
        });
        this.paymentsFormats = await new Payment().all();
    },

    computed: {

    },

    methods: {
        formatMoney(value) {
            return parseFloat(value).toFixed(2).replace('.', ',')
        },

        // this function is here, becouse it is used in two different components
        async closeCashier() {
            let html = `<input style="margin-bottom: 2;" id="swal-input1" type="text"  value="${this.paymentsFormats[0].id}" placeholder="Valor a receber" class="swal2-input"><br>`;
            this.paymentsFormats.forEach((element) => {
                html += `<span style='font-size: 14'>${element.id}-${element.name} </span>`;
            });
            html +=
                '<input id="swal-input2" placeholder="Valor a lançar" class="swal2-input">';

            html += "<hr>";
            html += "<div class='row font-big'>";
            if (this.computedPaymentAmount > 0) {
                let paymentInfo = await new Payment().tratePayment(this.paymentInfo);
                for await (const iterator of paymentInfo) {
                    let paymentName = await new Payment().get(iterator.payment_id);
                    html += "<div class='col-6 text-left'>";
                    html += paymentName;
                    html += "</div>";
                    html += "<div class='col-6 text-right'>";
                    html += this.formatMoney(iterator.price);
                    html += "</div>";
                }
            } else {
                html += "<div class='col-12 text-center text-danger'>";
                html += "Nehum valor lançado";
                html += "</div>";
            }

            html += "</div>";
            html += "<hr>";

            Swal.fire({
                title: "Informações do fechamento",
                showCancelButton: true,
                cancelButtonText: "Cancelar",
                confirmButtonText: "Finalizar",
                html: html,
                didOpen: () => {
                    document.getElementById("swal-input1").focus()
                    document.getElementById("swal-input2").value = 0
                },
                preConfirm: () => { },
            }).then((result) => {
                if (result.isConfirmed) {
                    Swal.fire({
                        icon: "question",
                        title: "Finalizar fechamento de caixa?",
                        showCancelButton: true,
                        cancelButtonText: "Cancelar",
                    }).then(async (result) => {
                        if (result.isDismissed) {
                            this.closeCashier();
                        } else if (result.isConfirmed) {
                            let response_cashier = await new Cashier().detail();

                            await new DB().execute("BEGIN;");

                            await new Cashier().update([response_cashier]);

                            // insert payments order
                            let paymentsCashiers = [];
                            for await (const iterator of this.paymentInfo) {
                                paymentsCashiers.push({
                                    cashier_id: response_cashier.id,
                                    payment_id: iterator.payment_id,
                                    price: iterator.price,
                                });
                            }

                            await new PaymentCashier().create(paymentsCashiers);

                            await new DB().execute("COMMIT;");

                            EventBus.$emit("cashier-closed", true);

                            this.reset();

                            Swal.fire({
                                text: "Caixa fechado!",
                                icon: "success",
                            });
                        }
                    });

                } else {
                    this.paymentInfo = [];
                }
            });
        },
    },
}